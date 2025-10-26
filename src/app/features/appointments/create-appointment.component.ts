<<<<<<< HEAD
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
=======
import { Component, OnDestroy, OnInit } from '@angular/core';
>>>>>>> remotes/origin/codex/analyser-le-code-et-proposer-des-ameliorations-t6thm6
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
<<<<<<< HEAD
<<<<<<< HEAD
import { DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';
=======
import { DoctorProfile } from '@app/core/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, catchError, combineLatest, map, of, shareReplay } from 'rxjs';
>>>>>>> remotes/origin/codex/refactor-dashboard-and-appointment-components
=======
import { Appointment, AppointmentStatus, DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';
import { MatListModule } from '@angular/material/list';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
>>>>>>> remotes/origin/codex/analyser-le-code-et-proposer-des-ameliorations-t6thm6

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
<<<<<<< HEAD
  templateUrl: './create-appointment.component.html',
  styleUrls: ['./create-appointment.component.scss']
=======
  template: `
    <div class="create-appointment-container">
      <mat-card class="appointment-card">
        <mat-card-header>
          <mat-card-title>
            <h1>📅 Prendre un rendez-vous</h1>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="appointmentForm" (ngSubmit)="onSubmit()">
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Choisir un médecin</mat-label>
              <mat-select formControlName="doctorId">
                <mat-option *ngFor="let doctor of (doctors$ | async) ?? []" [value]="doctor.userId">
                  Dr. {{ doctor.user?.firstName }} {{ doctor.user?.lastName }}
                  - {{ getSpecialtyLabel(doctor.specialty) }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="appointmentForm.get('doctorId')?.hasError('required')">
                Veuillez choisir un médecin
              </mat-error>
            </mat-form-field>

            <div class="doctor-info" *ngIf="selectedDoctor$ | async as selectedDoctor">
              <mat-icon>info</mat-icon>
              <div>
                <p><strong>Disponibilité :</strong>
                  {{ selectedDoctor.availableFrom }} - {{ selectedDoctor.availableTo }}
                </p>
                <p *ngIf="selectedDoctor.consultationFee">
                  <strong>Tarif :</strong> {{ selectedDoctor.consultationFee }}€
                </p>
              </div>
            </div>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Date du rendez-vous</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="appointmentDate"
                     [min]="minDate" placeholder="Choisir une date">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-error *ngIf="appointmentForm.get('appointmentDate')?.hasError('required')">
                La date est requise
              </mat-error>
            </mat-form-field>

            <div class="time-fields">
              <mat-form-field appearance="outline">
                <mat-label>Heure</mat-label>
                <mat-select formControlName="hour">
                  <mat-option *ngFor="let hour of hours" [value]="hour">
                    {{ hour }}h
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Minutes</mat-label>
                <mat-select formControlName="minute">
                  <mat-option value="00">00</mat-option>
                  <mat-option value="15">15</mat-option>
                  <mat-option value="30">30</mat-option>
                  <mat-option value="45">45</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Durée (minutes)</mat-label>
              <mat-select formControlName="duration">
                <mat-option [value]="15">15 minutes</mat-option>
                <mat-option [value]="30">30 minutes</mat-option>
                <mat-option [value]="45">45 minutes</mat-option>
                <mat-option [value]="60">1 heure</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Motif de consultation</mat-label>
              <textarea matInput formControlName="reason" rows="3"
                        placeholder="Décrivez brièvement le motif de votre consultation"></textarea>
              <mat-error *ngIf="appointmentForm.get('reason')?.hasError('required')">
                Le motif est requis
              </mat-error>
              <mat-error *ngIf="appointmentForm.get('reason')?.hasError('minlength')">
                Minimum 10 caractères
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Notes additionnelles (optionnel)</mat-label>
              <textarea matInput formControlName="notes" rows="2"
                        placeholder="Informations complémentaires..."></textarea>
            </mat-form-field>

            <div class="actions">
              <button mat-raised-button type="button" routerLink="/doctors">
                Annuler
              </button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="appointmentForm.invalid || loading">
                <span *ngIf="!loading">Confirmer le rendez-vous</span>
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-appointment-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .appointment-card {
      max-width: 600px;
      width: 100%;
    }

    mat-card-title h1 {
      text-align: center;
      color: #667eea;
      margin: 0;
    }

    mat-form-field {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .doctor-info {
      display: flex;
      gap: 12px;
      padding: 16px;
      background-color: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .doctor-info mat-icon {
      color: #1976d2;
    }

    .doctor-info p {
      margin: 4px 0;
      color: #555;
    }

    .time-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .actions {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 24px;
    }

    .actions button {
      flex: 1;
    }

    button mat-spinner {
      display: inline-block;
      margin: 0 auto;
    }
  `]
>>>>>>> remotes/origin/codex/refactor-dashboard-and-appointment-components
})
<<<<<<< HEAD
export class CreateAppointmentComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
=======
export class CreateAppointmentComponent implements OnInit, OnDestroy {
>>>>>>> remotes/origin/codex/analyser-le-code-et-proposer-des-ameliorations-t6thm6
  appointmentForm: FormGroup;
  loading = false;
  minDate = new Date();
  hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h à 19h
<<<<<<< HEAD
  private readonly selectedDoctorIdSubject = new BehaviorSubject<string | null>(null);
  doctors$: Observable<DoctorProfile[]> = this.doctorService.getAllDoctors().pipe(
    map((response: any) => response.doctors ?? []),
    catchError(() => {
      this.snackBar.open('Erreur lors du chargement des médecins', 'Fermer', { duration: 3000 });
      return of([]);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  selectedDoctor$: Observable<DoctorProfile | null> = combineLatest([
    this.doctors$,
    this.selectedDoctorIdSubject.asObservable()
  ]).pipe(
    map(([doctors, doctorId]) => doctors.find(doctor => doctor.userId === doctorId) ?? null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
=======
  doctorAppointments: Appointment[] = [];
  conflictingAppointments: Appointment[] = [];
  slotStatus: 'idle' | 'checking' | 'available' | 'conflict' | 'outside-hours' = 'idle';
  slotMessage = '';
  availabilityLoading = false;

  private availabilityKey: string | null = null;
  private formChangesSub?: Subscription;
>>>>>>> remotes/origin/codex/analyser-le-code-et-proposer-des-ameliorations-t6thm6

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

    const initialDoctorId = this.appointmentForm.get('doctorId')?.value;
    this.selectedDoctorIdSubject.next(initialDoctorId || null);
  }

  ngOnInit(): void {
<<<<<<< HEAD
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params: any) => {
        if (params['doctorId']) {
          this.appointmentForm.patchValue({ doctorId: params['doctorId'] });
=======
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
>>>>>>> remotes/origin/codex/analyser-le-code-et-proposer-des-ameliorations-t6thm6
        }
      });

<<<<<<< HEAD
    this.appointmentForm.get('doctorId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((doctorId: string) => {
        this.selectedDoctorIdSubject.next(doctorId || null);
      });
=======
  onDoctorChange(event: any): void {
    this.selectedDoctor = this.doctors.find((d: any) => d.userId === event.value) || null;
    this.availabilityKey = null;
    this.fetchDoctorAppointmentsForSelectedDay();
    this.evaluateSlot();
>>>>>>> remotes/origin/codex/analyser-le-code-et-proposer-des-ameliorations-t6thm6
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

<<<<<<< HEAD
      this.appointmentService.createAppointment(appointmentData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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
=======
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
>>>>>>> remotes/origin/codex/analyser-le-code-et-proposer-des-ameliorations-t6thm6
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
