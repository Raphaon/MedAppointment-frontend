import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppointmentService } from '@app/core/services/appointment.service';
import { AuthService } from '@app/core/services/auth.service';
import {
  Appointment,
  AppointmentStatus,
  CreatePrescriptionDto,
  PatientVital,
  Prescription,
  PrescriptionItem,
  RecordPatientVitalDto,
  UserRole
} from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './appointment-detail.component.html',
  styleUrls: ['./appointment-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  appointment: Appointment | null = null;
  vitals: PatientVital[] = [];
  prescriptions: Prescription[] = [];

  vitalsForm: FormGroup;
  prescriptionForm: FormGroup;

  loading = false;
  savingVitals = false;
  savingPrescription = false;

  isNurse = false;
  isDoctor = false;
  readonly AppointmentStatus = AppointmentStatus;
  readonly UserRole = UserRole;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly appointmentService: AppointmentService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    private readonly snackBar: MatSnackBar
  ) {
    this.vitalsForm = this.fb.group({
      temperature: [null, [Validators.min(30), Validators.max(45)]],
      heartRate: [null, [Validators.min(0)]],
      respiratoryRate: [null, [Validators.min(0)]],
      bloodPressureSystolic: [null, [Validators.min(0)]],
      bloodPressureDiastolic: [null, [Validators.min(0)]],
      weight: [null, [Validators.min(0)]],
      notes: ['']
    });

    this.prescriptionForm = this.fb.group({
      notes: [''],
      items: this.fb.array([this.createPrescriptionItem()])
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.isNurse = user?.role === UserRole.NURSE;
        this.isDoctor = user?.role === UserRole.DOCTOR;
        this.cdr.markForCheck();
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const appointmentId = params.get('id');
        if (appointmentId) {
          this.loadAppointment(appointmentId);
        }
      });
  }

  get prescriptionItems(): FormArray {
    return this.prescriptionForm.get('items') as FormArray;
  }

  addPrescriptionItem(): void {
    this.prescriptionItems.push(this.createPrescriptionItem());
  }

  removePrescriptionItem(index: number): void {
    if (this.prescriptionItems.length > 1) {
      this.prescriptionItems.removeAt(index);
    }
  }

  trackByPrescriptionItem(index: number, item: FormGroup): string {
    return item.get('medication')?.value ?? item.get('dosage')?.value ?? index.toString();
  }

  recordVitals(): void {
    if (!this.appointment || this.vitalsForm.invalid) {
      this.snackBar.open('Merci de vérifier les paramètres saisis.', 'Fermer', { duration: 3000 });
      return;
    }

    this.savingVitals = true;
    const payload: RecordPatientVitalDto = {
      temperature: this.vitalsForm.value.temperature,
      heartRate: this.vitalsForm.value.heartRate,
      respiratoryRate: this.vitalsForm.value.respiratoryRate,
      bloodPressureSystolic: this.vitalsForm.value.bloodPressureSystolic,
      bloodPressureDiastolic: this.vitalsForm.value.bloodPressureDiastolic,
      weight: this.vitalsForm.value.weight,
      notes: this.vitalsForm.value.notes?.trim() || null
    };

    this.appointmentService
      .recordPatientVitals(this.appointment.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ vital }) => {
          this.vitals = [vital, ...this.vitals];
          this.vitalsForm.reset();
          this.savingVitals = false;
          this.cdr.markForCheck();
          this.snackBar.open('Paramètres vitaux enregistrés', 'Fermer', { duration: 3000 });
        },
        error: () => {
          this.savingVitals = false;
          this.cdr.markForCheck();
          this.snackBar.open('Impossible d\'enregistrer les paramètres vitaux.', 'Fermer', { duration: 4000 });
        }
      });
  }

  createPrescription(): void {
    if (!this.appointment || this.prescriptionForm.invalid) {
      this.snackBar.open('Merci de compléter la prescription.', 'Fermer', { duration: 3000 });
      return;
    }

    const items = (this.prescriptionItems.value as PrescriptionItem[]).filter((item) => item.medication && item.dosage && item.frequency);
    if (items.length === 0) {
      this.snackBar.open('Ajoutez au moins un médicament.', 'Fermer', { duration: 3000 });
      return;
    }

    this.savingPrescription = true;

    const payload: CreatePrescriptionDto = {
      notes: this.prescriptionForm.value.notes?.trim() || undefined,
      items: items.map((item) => ({
        medication: item.medication.trim(),
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
        duration: item.duration?.trim() || undefined,
        instructions: item.instructions?.trim() || undefined
      }))
    };

    this.appointmentService
      .createPrescription(this.appointment.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ prescription }) => {
          this.prescriptions = [prescription, ...this.prescriptions];
          this.prescriptionForm.reset({ notes: '' });
          this.prescriptionItems.clear();
          this.prescriptionItems.push(this.createPrescriptionItem());
          this.savingPrescription = false;
          this.cdr.markForCheck();
          this.snackBar.open('Prescription créée', 'Fermer', { duration: 3000 });
        },
        error: () => {
          this.savingPrescription = false;
          this.cdr.markForCheck();
          this.snackBar.open('Impossible d\'enregistrer la prescription.', 'Fermer', { duration: 4000 });
        }
      });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSpecialty(): string {
    if (!this.appointment?.doctor?.doctorProfile?.specialty) {
      return 'Non spécifiée';
    }
    return getMedicalSpecialtyLabel(this.appointment.doctor.doctorProfile.specialty);
  }

  getStatusLabel(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'Confirmé';
      case AppointmentStatus.PENDING:
        return 'En attente';
      case AppointmentStatus.CANCELLED:
        return 'Annulé';
      case AppointmentStatus.COMPLETED:
        return 'Terminé';
      case AppointmentStatus.NO_SHOW:
        return 'Absent';
      default:
        return status;
    }
  }

  private loadAppointment(id: string): void {
    this.loading = true;
    this.appointmentService
      .getAppointmentById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ appointment }) => {
          this.appointment = appointment;
          this.vitals = appointment.vitals ?? [];
          this.prescriptions = appointment.prescriptions ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.appointment = null;
          this.cdr.markForCheck();
          this.snackBar.open('Rendez-vous introuvable.', 'Fermer', { duration: 4000 });
        }
      });
  }

  private createPrescriptionItem(): FormGroup {
    return this.fb.group({
      medication: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      duration: [''],
      instructions: ['']
    });
  }
}
