import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService } from '@app/core/services/appointment.service';
import { DoctorService } from '@app/core/services/doctor.service';
import { AuthService } from '@app/core/services/auth.service';
import { Appointment, AppointmentStatus, DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';
import { MatListModule } from '@angular/material/list';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-create-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './create-appointment.component.html',
  styleUrls: ['./create-appointment.component.scss']
})
export class CreateAppointmentComponent implements OnInit, OnDestroy {
  appointmentForm: FormGroup;
  loading = false;
  doctors: DoctorProfile[] = [];
  selectedDoctor: DoctorProfile | null = null;
  minDate = new Date();
  hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h à 19h
  doctorAppointments: Appointment[] = [];
  conflictingAppointments: Appointment[] = [];
  slotStatus: 'idle' | 'checking' | 'available' | 'conflict' | 'outside-hours' = 'idle';
  slotMessage = '';
  availabilityLoading = false;

  private availabilityKey: string | null = null;
  private formChangesSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.appointmentForm = this.fb.group({
      doctorId: ['', Validators.required],
      appointmentDate: ['', Validators.required],
      hour: ['09', Validators.required],
      minute: ['00', Validators.required],
      duration: [30, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadDoctors();

    // Pré-sélectionner un médecin si passé en paramètre
    this.route.queryParams.subscribe((params: any) => {
      if (params['doctorId']) {
        this.appointmentForm.patchValue({ doctorId: params['doctorId'] });
      }
    });

    this.observeFormChanges();
  }

  ngOnDestroy(): void {
    this.formChangesSub?.unsubscribe();
  }

  loadDoctors(): void {
    this.doctorService.getAllDoctors().subscribe({
      next: (response: any) => {
        this.doctors = response.doctors;
        
        // Si un doctorId est pré-sélectionné, charger ses infos
        const preselectedDoctorId = this.appointmentForm.get('doctorId')?.value;
        if (preselectedDoctorId) {
          this.selectedDoctor = this.doctors.find((d: any) => d.userId === preselectedDoctorId) || null;
          this.fetchDoctorAppointmentsForSelectedDay();
        }
      },
      error: (error: any) => {
        this.snackBar.open('Erreur lors du chargement des médecins', 'Fermer', { duration: 3000 });
      }
    });
  }

  onDoctorChange(event: any): void {
    this.selectedDoctor = this.doctors.find((d: any) => d.userId === event.value) || null;
    this.availabilityKey = null;
    this.fetchDoctorAppointmentsForSelectedDay();
    this.evaluateSlot();
  }

  getSpecialtyLabel(specialty: MedicalSpecialty): string {
    return getMedicalSpecialtyLabel(specialty);
  }

  onSubmit(): void {
    this.evaluateSlot();

    if (this.appointmentForm.valid && this.slotStatus === 'available') {
      this.loading = true;

      const formValue = this.appointmentForm.value;
      const currentUser = this.authService.getCurrentUser();

      if (!currentUser) {
        this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 3000 });
        this.loading = false;
        return;
      }

      // Construire la date complète
      const date = new Date(formValue.appointmentDate);
      date.setHours(parseInt(formValue.hour), parseInt(formValue.minute), 0, 0);

      const appointmentData = {
        doctorId: formValue.doctorId,
        patientId: currentUser.id,
        appointmentDate: date.toISOString(),
        duration: formValue.duration,
        reason: formValue.reason,
        notes: formValue.notes || undefined
      };

      this.appointmentService.createAppointment(appointmentData).subscribe({
        next: () => {
          this.snackBar.open('✅ Rendez-vous créé avec succès !', 'Fermer', { duration: 5000 });
          this.router.navigate(['/appointments']);
        },
        error: (error: any) => {
          this.loading = false;
          const errorMsg = error.error?.error || 'Erreur lors de la création du rendez-vous';
          this.snackBar.open(errorMsg, 'Fermer', { duration: 5000 });
        }
      });
    } else if (this.slotStatus === 'conflict') {
      this.snackBar.open('Ce créneau est déjà réservé. Veuillez choisir une autre heure.', 'Fermer', { duration: 4000 });
    } else if (this.slotStatus === 'outside-hours') {
      this.snackBar.open('Le créneau sélectionné dépasse les horaires disponibles du médecin.', 'Fermer', { duration: 4000 });
    }
  }

  get submitDisabled(): boolean {
    return this.appointmentForm.invalid || this.loading ||
      this.slotStatus === 'conflict' || this.slotStatus === 'outside-hours' || this.slotStatus === 'checking';
  }

  getSlotStatusIcon(): string {
    switch (this.slotStatus) {
      case 'available':
        return 'check_circle';
      case 'conflict':
        return 'event_busy';
      case 'outside-hours':
        return 'schedule';
      case 'checking':
        return 'sync';
      default:
        return 'event';
    }
  }

  trackByAppointment(_: number, appointment: Appointment): string {
    return appointment.id;
  }

  private observeFormChanges(): void {
    this.formChangesSub = this.appointmentForm.valueChanges
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.fetchDoctorAppointmentsForSelectedDay();
        this.evaluateSlot();
      });
  }

  private fetchDoctorAppointmentsForSelectedDay(): void {
    const doctorId = this.appointmentForm.get('doctorId')?.value;
    const date = this.appointmentForm.get('appointmentDate')?.value;

    if (!doctorId || !date) {
      this.doctorAppointments = [];
      this.availabilityKey = null;
      return;
    }

    const normalizedDoctor = this.doctors.find((d) => d.userId === doctorId);
    if (normalizedDoctor) {
      this.selectedDoctor = normalizedDoctor;
    }

    const day = new Date(date);
    const key = `${doctorId}_${day.toDateString()}`;
    if (this.availabilityKey === key) {
      return;
    }

    this.availabilityKey = key;
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    this.availabilityLoading = true;
    this.slotStatus = 'checking';
    this.slotMessage = 'Vérification de la disponibilité du médecin...';

    this.appointmentService.getDoctorAppointments(
      doctorId,
      startOfDay.toISOString(),
      endOfDay.toISOString()
    ).subscribe({
      next: (response) => {
        this.doctorAppointments = response.appointments || [];
        this.availabilityLoading = false;
        this.evaluateSlot();
      },
      error: () => {
        this.availabilityLoading = false;
        this.doctorAppointments = [];
        this.availabilityKey = null;
        this.slotStatus = 'idle';
        this.slotMessage = '';
        this.snackBar.open('Impossible de vérifier la disponibilité du médecin.', 'Fermer', { duration: 4000 });
      }
    });
  }

  private evaluateSlot(): void {
    const doctorId = this.appointmentForm.get('doctorId')?.value;
    const date = this.appointmentForm.get('appointmentDate')?.value;
    const hour = this.appointmentForm.get('hour')?.value;
    const minute = this.appointmentForm.get('minute')?.value;
    const duration = Number(this.appointmentForm.get('duration')?.value || 0);

    if (!doctorId || !date || !hour || minute === null || duration <= 0) {
      this.slotStatus = 'idle';
      this.slotMessage = '';
      this.conflictingAppointments = [];
      return;
    }

    const start = new Date(date);
    start.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
    const end = new Date(start.getTime() + duration * 60000);

    if (this.availabilityLoading) {
      this.slotStatus = 'checking';
      this.slotMessage = 'Vérification de la disponibilité du médecin...';
      this.conflictingAppointments = [];
      return;
    }

    if (!this.isWithinDoctorHours(start, end)) {
      this.slotStatus = 'outside-hours';
      this.slotMessage = 'Le créneau choisi dépasse les horaires disponibles du médecin.';
      this.conflictingAppointments = [];
      return;
    }

    const conflicts = this.getConflictingAppointments(start, end);
    this.conflictingAppointments = conflicts;

    if (conflicts.length > 0) {
      this.slotStatus = 'conflict';
      this.slotMessage = 'Ce créneau est déjà réservé par un autre rendez-vous.';
    } else {
      this.slotStatus = 'available';
      this.slotMessage = 'Créneau disponible ✅';
    }
  }

  private isWithinDoctorHours(start: Date, end: Date): boolean {
    if (!this.selectedDoctor?.availableFrom || !this.selectedDoctor?.availableTo) {
      return true;
    }

    const availabilityStart = this.buildDateFromTime(start, this.selectedDoctor.availableFrom);
    const availabilityEnd = this.buildDateFromTime(start, this.selectedDoctor.availableTo);

    if (availabilityEnd <= availabilityStart) {
      availabilityEnd.setDate(availabilityEnd.getDate() + 1);
    }

    return start >= availabilityStart && end <= availabilityEnd;
  }

  private buildDateFromTime(base: Date, time: string): Date {
    const [hourString, minuteString] = time.split(':');
    const hours = parseInt(hourString, 10);
    const minutes = parseInt(minuteString || '0', 10);
    const date = new Date(base);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private getConflictingAppointments(start: Date, end: Date): Appointment[] {
    return this.doctorAppointments.filter((appointment: Appointment) => {
      if (appointment.status === AppointmentStatus.CANCELLED) {
        return false;
      }

      const existingStart = new Date(appointment.appointmentDate);
      const duration = appointment.duration && appointment.duration > 0 ? appointment.duration : 30;
      const existingEnd = new Date(existingStart.getTime() + duration * 60000);
      return existingStart < end && existingEnd > start;
    });
  }
}
