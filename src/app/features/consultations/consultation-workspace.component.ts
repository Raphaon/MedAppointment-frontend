import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';

import {
  Appointment,
  AppointmentStatus,
  CompleteConsultationDto,
  Consultation,
  CreateMedicalRecordEntryDto,
  MedicalRecordEntry,
  MedicalRecordEntryType,
  UpdateConsultationDto
} from '@app/core/models';
import { AppointmentService } from '@app/core/services/appointment.service';
import { ConsultationService } from '@app/core/services/consultation.service';

@Component({
  selector: 'app-consultation-workspace',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './consultation-workspace.component.html',
  styleUrls: ['./consultation-workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultationWorkspaceComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);
  private readonly consultationService = inject(ConsultationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly AppointmentStatus = AppointmentStatus;
  readonly MedicalRecordEntryType = MedicalRecordEntryType;

  appointment?: Appointment;
  consultation: Consultation | null = null;
  medicalRecords: MedicalRecordEntry[] = [];

  loading = true;
  timelineLoading = false;
  startingConsultation = false;
  savingConsultation = false;
  completingConsultation = false;
  addingRecord = false;

  readonly recordTypeOptions = [
    { label: 'Compte rendu', value: MedicalRecordEntryType.CONSULTATION_NOTE },
    { label: 'Prescription', value: MedicalRecordEntryType.PRESCRIPTION },
    { label: 'Examen', value: MedicalRecordEntryType.EXAMINATION },
    { label: 'Document', value: MedicalRecordEntryType.DOCUMENT }
  ];

  consultationForm = this.fb.group({
    notes: [''],
    diagnosis: [''],
    treatmentPlan: [''],
    followUpDate: [null]
  });

  recordForm = this.fb.group({
    type: [MedicalRecordEntryType.CONSULTATION_NOTE, Validators.required],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    content: ['', [Validators.required, Validators.maxLength(5000)]]
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const appointmentId = params.get('appointmentId');
        if (!appointmentId) {
          this.snackBar.open('Consultation introuvable', 'Fermer', { duration: 3000 });
          this.router.navigate(['/appointments']);
          return;
        }

        this.loadContext(appointmentId);
      });
  }

  get hasConsultation(): boolean {
    return !!this.consultation;
  }

  get canStartConsultation(): boolean {
    return !!this.appointment && !this.consultation && this.appointment.status !== AppointmentStatus.CANCELLED;
  }

  get canCompleteConsultation(): boolean {
    return !!this.consultation && !this.completingConsultation;
  }

  startConsultation(): void {
    if (!this.appointment || this.startingConsultation) {
      return;
    }

    this.startingConsultation = true;
    this.consultationService
      .startConsultation({ appointmentId: this.appointment.id })
      .pipe(take(1))
      .subscribe({
        next: ({ consultation }) => {
          this.consultation = consultation;
          this.patchConsultationForm(consultation);
          this.updateMedicalRecords(consultation.medicalRecords ?? []);
          this.snackBar.open('Consultation démarrée', 'Fermer', { duration: 3000 });
          this.startingConsultation = false;
        },
        error: () => {
          this.snackBar.open('Impossible de démarrer la consultation', 'Fermer', { duration: 3000 });
          this.startingConsultation = false;
        }
      });
  }

  saveConsultation(): void {
    if (!this.consultation || this.savingConsultation) {
      return;
    }

    const payload = this.buildConsultationPayload();
    this.savingConsultation = true;
    this.consultationService
      .updateConsultation(this.consultation.id, payload)
      .pipe(take(1))
      .subscribe({
        next: ({ consultation }) => {
          this.consultation = consultation;
          this.patchConsultationForm(consultation);
          this.snackBar.open('Consultation enregistrée', 'Fermer', { duration: 3000 });
          this.savingConsultation = false;
        },
        error: () => {
          this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
          this.savingConsultation = false;
        }
      });
  }

  completeConsultation(): void {
    if (!this.consultation || this.completingConsultation) {
      return;
    }

    const payload: CompleteConsultationDto = {
      ...this.buildConsultationPayload(),
      summary: this.consultationSummary
    };

    this.completingConsultation = true;
    this.consultationService
      .completeConsultation(this.consultation.id, payload)
      .pipe(take(1))
      .subscribe({
        next: ({ consultation }) => {
          this.consultation = consultation;
          this.patchConsultationForm(consultation);
          this.snackBar.open('Consultation terminée', 'Fermer', { duration: 3000 });
          this.completingConsultation = false;
        },
        error: () => {
          this.snackBar.open('Impossible de terminer la consultation', 'Fermer', { duration: 3000 });
          this.completingConsultation = false;
        }
      });
  }

  addMedicalRecord(): void {
    if (!this.consultation || this.recordForm.invalid || this.addingRecord) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const formValue = this.recordForm.value as CreateMedicalRecordEntryDto;
    this.addingRecord = true;
    this.consultationService
      .addMedicalRecordEntry(this.consultation.id, formValue)
      .pipe(take(1))
      .subscribe({
        next: ({ consultation }) => {
          this.consultation = consultation;
          this.updateMedicalRecords(consultation.medicalRecords ?? []);
          this.recordForm.reset({
            type: MedicalRecordEntryType.CONSULTATION_NOTE,
            title: '',
            content: ''
          });
          this.snackBar.open('Entrée ajoutée au dossier médical', 'Fermer', { duration: 3000 });
          this.addingRecord = false;
        },
        error: () => {
          this.snackBar.open('Impossible d\'ajouter l\'entrée', 'Fermer', { duration: 3000 });
          this.addingRecord = false;
        }
      });
  }

  removeRecord(record: MedicalRecordEntry): void {
    if (!this.consultation) {
      return;
    }

    this.consultationService
      .deleteMedicalRecordEntry(this.consultation.id, record.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          const updated = this.medicalRecords.filter((entry) => entry.id !== record.id);
          this.updateMedicalRecords(updated);
          this.snackBar.open('Entrée supprimée', 'Fermer', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Impossible de supprimer l\'entrée', 'Fermer', { duration: 3000 });
        }
      });
  }

  getRecordTypeLabel(type: MedicalRecordEntryType): string {
    const label = this.recordTypeOptions.find((option) => option.value === type)?.label;
    return label ?? 'Donnée clinique';
  }

  goBack(): void {
    this.router.navigate(['/appointments']);
  }

  trackByRecord(_: number, record: MedicalRecordEntry): string {
    return record.id;
  }

  private loadContext(appointmentId: string): void {
    this.loading = true;
    this.appointmentService
      .getAppointmentById(appointmentId)
      .pipe(take(1))
      .subscribe({
        next: ({ appointment }) => {
          this.appointment = appointment;
          this.loadConsultation(appointment.id);
          if (appointment.patientId) {
            this.loadMedicalRecords(appointment.patientId);
          } else {
            this.timelineLoading = false;
          }
        },
        error: () => {
          this.snackBar.open('Impossible de charger le rendez-vous', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  private loadConsultation(appointmentId: string): void {
    this.consultationService
      .getConsultationByAppointment(appointmentId)
      .pipe(take(1))
      .subscribe({
        next: ({ consultation }) => {
          this.consultation = consultation;
          if (consultation) {
            this.patchConsultationForm(consultation);
            this.updateMedicalRecords(consultation.medicalRecords ?? []);
          } else {
            this.consultationForm.reset({ notes: '', diagnosis: '', treatmentPlan: '', followUpDate: null });
          }
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('Erreur lors du chargement de la consultation', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  private loadMedicalRecords(patientId: string): void {
    this.timelineLoading = true;
    this.consultationService
      .getPatientRecords(patientId)
      .pipe(take(1))
      .subscribe({
        next: ({ records }) => {
          this.updateMedicalRecords(records);
          this.timelineLoading = false;
        },
        error: () => {
          this.timelineLoading = false;
        }
      });
  }

  private patchConsultationForm(consultation: Consultation): void {
    this.consultationForm.patchValue({
      notes: consultation.notes ?? '',
      diagnosis: consultation.diagnosis ?? '',
      treatmentPlan: consultation.treatmentPlan ?? '',
      followUpDate: consultation.followUpDate ? new Date(consultation.followUpDate) : null
    });
  }

  private buildConsultationPayload(): UpdateConsultationDto {
    const { notes, diagnosis, treatmentPlan, followUpDate } = this.consultationForm.value;
    return {
      notes: notes ?? undefined,
      diagnosis: diagnosis ?? undefined,
      treatmentPlan: treatmentPlan ?? undefined,
      followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined
    };
  }

  private updateMedicalRecords(records: MedicalRecordEntry[]): void {
    this.medicalRecords = [...records].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private get consultationSummary(): string | undefined {
    const diagnosis = this.consultationForm.get('diagnosis')?.value;
    const treatment = this.consultationForm.get('treatmentPlan')?.value;
    if (diagnosis || treatment) {
      return [diagnosis, treatment].filter(Boolean).join(' • ');
    }
    return this.consultationForm.get('notes')?.value ?? undefined;
  }
}
