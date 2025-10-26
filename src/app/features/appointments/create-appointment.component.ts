import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, take } from 'rxjs';

import { AppointmentService } from '@app/core/services/appointment.service';
import { DoctorService } from '@app/core/services/doctor.service';
import { AuthService } from '@app/core/services/auth.service';
import { Appointment, AppointmentStatus, CreateAppointmentDto, DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

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
  styleUrls: ['./create-appointment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateAppointmentComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  appointmentForm: FormGroup;
  doctors: DoctorProfile[] = [];
  selectedDoctor: DoctorProfile | null = null;
  hours: number[] = Array.from({ length: 11 }, (_, index) => index + 8);
  minDate: Date = new Date();
  slotStatus: 'idle' | 'checking' | 'available' | 'unavailable' | 'error' = 'idle';
  slotMessage = '';
  conflictingAppointments: Appointment[] = [];
  loading = false;
  submitDisabled = true;

  private patientId: string | null = null;
  private availabilitySub?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly appointmentService: AppointmentService,
    private readonly doctorService: DoctorService,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.appointmentForm = this.fb.group({
      doctorId: ['', Validators.required],
      appointmentDate: [null, Validators.required],
      hour: ['08', Validators.required],
      minute: ['00', Validators.required],
      duration: [30, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['']
    });

    this.minDate.setHours(0, 0, 0, 0);
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.patientId = user?.id ?? null;
      });

    this.loadDoctors();
    this.watchAvailabilityTriggers();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const doctorId = params.get('doctorId');
        if (doctorId) {
          this.appointmentForm.patchValue({ doctorId });
          this.updateSelectedDoctor(doctorId);
          this.checkSlotAvailability();
        }
      });
  }

  ngOnDestroy(): void {
    this.availabilitySub?.unsubscribe();
  }

  getSpecialtyLabel(specialty: MedicalSpecialty): string {
    return getMedicalSpecialtyLabel(specialty);
  }

  onDoctorChange(event: MatSelectChange): void {
    const doctorId = event.value as string;
    this.updateSelectedDoctor(doctorId);
    this.checkSlotAvailability();
  }

  trackByAppointment(_: number, appointment: Appointment): string {
    return appointment.id;
  }

  getSlotStatusIcon(): string {
    switch (this.slotStatus) {
      case 'checking':
        return 'hourglass_empty';
      case 'available':
        return 'check_circle';
      case 'unavailable':
        return 'error';
      case 'error':
        return 'warning';
      default:
        return 'info';
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid || !this.patientId) {
      this.snackBar.open('Veuillez compléter le formulaire', 'Fermer', { duration: 3000 });
      return;
    }

    if (this.slotStatus === 'checking' || this.slotStatus === 'unavailable') {
      return;
    }

    const { doctorId, appointmentDate, hour, minute, duration, reason, notes } = this.appointmentForm.value;
    const date = new Date(appointmentDate);
    date.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

    if (date.getTime() < Date.now()) {
      this.snackBar.open('Veuillez sélectionner un créneau futur.', 'Fermer', { duration: 3000 });
      return;
    }

    const payload: CreateAppointmentDto = {
      doctorId,
      patientId: this.patientId,
      appointmentDate: date.toISOString(),
      duration: Number(duration),
      reason: reason.trim(),
      notes: notes?.trim() || undefined
    };

    this.loading = true;
    this.submitDisabled = true;

    this.appointmentService.createAppointment(payload).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', { duration: 3000 });
        this.router.navigate(['/appointments']);
      },
      error: (error) => {
        this.loading = false;
        this.submitDisabled = false;
        const message = error?.error?.message || 'Erreur lors de la création du rendez-vous';
        this.snackBar.open(message, 'Fermer', { duration: 4000 });
      }
    });
  }

  getSlotStatusClass(): string {
    return this.slotStatus;
  }

  private loadDoctors(): void {
    this.doctorService
      .getAllDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ doctors }) => {
          this.doctors = doctors ?? [];
          if (this.appointmentForm.get('doctorId')?.value) {
            this.updateSelectedDoctor(this.appointmentForm.get('doctorId')?.value);
          }
        },
        error: (error) => {
          const message = error?.message || 'Erreur lors du chargement des médecins';
          this.snackBar.open(message, 'Fermer', { duration: 4000 });
          this.doctors = [];
        }
      });
  }

  private updateSelectedDoctor(doctorId: string): void {
    this.selectedDoctor = this.doctors.find((doctor) => doctor.userId === doctorId) ?? null;
  }

  private watchAvailabilityTriggers(): void {
    const controls = ['doctorId', 'appointmentDate', 'hour', 'minute', 'duration'] as const;
    controls.forEach((controlName) => {
      this.appointmentForm
        .get(controlName)
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.checkSlotAvailability();
        });
    });

    this.appointmentForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateSubmitState());
  }

  private checkSlotAvailability(): void {
    const doctorId = this.appointmentForm.get('doctorId')?.value as string | null;
    const appointmentDate = this.appointmentForm.get('appointmentDate')?.value as Date | null;
    const hour = this.appointmentForm.get('hour')?.value as string | null;
    const minute = this.appointmentForm.get('minute')?.value as string | null;
    const duration = Number(this.appointmentForm.get('duration')?.value ?? 30);

    if (!doctorId || !appointmentDate || hour === null || minute === null) {
      this.resetSlotFeedback();
      return;
    }

    const start = new Date(appointmentDate);
    start.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
    const end = new Date(start.getTime() + duration * 60000);

    if (start.getTime() < Date.now()) {
      this.slotStatus = 'unavailable';
      this.slotMessage = 'Sélectionnez un créneau futur.';
      this.conflictingAppointments = [];
      this.updateSubmitState();
      return;
    }

    this.slotStatus = 'checking';
    this.slotMessage = 'Vérification de la disponibilité...';
    this.conflictingAppointments = [];
    this.updateSubmitState();

    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(start);
    dayEnd.setHours(23, 59, 59, 999);

    this.availabilitySub?.unsubscribe();
    this.availabilitySub = this.appointmentService
      .getDoctorAppointments(doctorId, dayStart.toISOString(), dayEnd.toISOString())
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const appointments = response.appointments ?? [];
          const conflicts = appointments.filter((appointment) => {
            const existingStart = new Date(appointment.appointmentDate);
            const existingEnd = new Date(existingStart.getTime() + (appointment.duration ?? 30) * 60000);
            return existingStart < end && start < existingEnd && appointment.status !== AppointmentStatus.CANCELLED;
          });

          this.conflictingAppointments = conflicts;

          if (conflicts.length > 0) {
            this.slotStatus = 'unavailable';
            this.slotMessage = `${conflicts.length} créneau(x) en conflit trouvé(s).`;
          } else {
            this.slotStatus = 'available';
            this.slotMessage = 'Créneau disponible.';
          }

          this.updateSubmitState();
        },
        error: () => {
          this.slotStatus = 'error';
          this.slotMessage = 'Impossible de vérifier la disponibilité.';
          this.conflictingAppointments = [];
          this.updateSubmitState();
        }
      });
  }

  private resetSlotFeedback(): void {
    this.slotStatus = 'idle';
    this.slotMessage = '';
    this.conflictingAppointments = [];
    this.updateSubmitState();
  }

  private updateSubmitState(): void {
    this.submitDisabled =
      this.slotStatus === 'checking' ||
      this.slotStatus === 'unavailable' ||
      this.appointmentForm.invalid ||
      this.loading;
  }
}
