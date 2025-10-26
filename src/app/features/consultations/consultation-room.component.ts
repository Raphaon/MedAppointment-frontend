import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, combineLatest } from 'rxjs';

import { ConsultationService } from '@app/core/services/consultation.service';
import { CompleteConsultationDto, Consultation, ConsultationEvent, ConsultationStatus } from '@app/core/models';
import { ConsultationSummaryComponent } from './consultation-summary.component';

@Component({
  selector: 'app-consultation-room',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ConsultationSummaryComponent
  ],
  templateUrl: './consultation-room.component.html',
  styleUrls: ['./consultation-room.component.scss']
})
export class ConsultationRoomComponent implements OnInit, OnDestroy {
  consultation?: Consultation;
  loading = true;
  patientOnline = false;
  doctorOnline = true;
  events: ConsultationEvent[] = [];
  showSummaryForm = false;
  private subscriptions: Subscription[] = [];
  private eventStreamSub?: Subscription;
  token?: string | null;
  roomUrl?: string | null;

  ConsultationStatus = ConsultationStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const sub = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const consultationId = params.get('id');
      this.token = queryParams.get('token');
      this.roomUrl = queryParams.get('roomUrl');

      if (!consultationId) {
        this.snackBar.open('Consultation introuvable', 'Fermer', { duration: 3000 });
        this.router.navigate(['/consultations']);
        return;
      }

      this.loadConsultation(consultationId);
    });

    this.subscriptions.push(sub);
  }

  loadConsultation(id: string): void {
    this.loading = true;
    const sub = this.consultationService.getConsultationById(id).subscribe({
      next: (consultation) => {
        this.consultation = consultation;
        this.loading = false;
        this.attachEventStream(consultation.id);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Impossible de charger la consultation', 'Fermer', { duration: 4000 });
      }
    });

    this.subscriptions.push(sub);
  }

  attachEventStream(id: string): void {
    this.eventStreamSub?.unsubscribe();
    this.events = [];
    this.patientOnline = false;
    this.eventStreamSub = this.consultationService.listenToConsultationEvents(id).subscribe({
      next: (event) => {
        this.events = [...this.events.slice(-20), event];
        if (event.type === 'patient_joined') {
          this.patientOnline = true;
        }
        if (event.type === 'patient_left') {
          this.patientOnline = false;
        }
        if (event.type === 'doctor_joined') {
          this.doctorOnline = true;
        }
        if (event.type === 'doctor_left') {
          this.doctorOnline = false;
        }
        if (event.type === 'status_updated' && event.payload?.status && this.consultation) {
          this.consultation = { ...this.consultation, status: event.payload.status as ConsultationStatus };
        }
        if (event.payload?.summary && this.consultation) {
          this.consultation = { ...this.consultation, summary: event.payload.summary, prescriptionUrl: event.payload.prescriptionUrl ?? this.consultation.prescriptionUrl };
        }
      },
      error: () => {
        this.snackBar.open('Flux temps réel interrompu', 'Fermer', { duration: 4000 });
      }
    });
  }

  ngOnDestroy(): void {
    this.eventStreamSub?.unsubscribe();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  get statusChipColor(): 'primary' | 'accent' | 'warn' | undefined {
    switch (this.consultation?.status) {
      case ConsultationStatus.IN_PROGRESS:
        return 'primary';
      case ConsultationStatus.COMPLETED:
        return 'accent';
      case ConsultationStatus.CANCELLED:
        return 'warn';
      default:
        return undefined;
    }
  }

  describeEvent(event: ConsultationEvent): string {
    const labels: Record<ConsultationEvent['type'], string> = {
      patient_joined: 'Patient connecté',
      patient_left: 'Patient déconnecté',
      doctor_joined: 'Médecin connecté',
      doctor_left: 'Médecin déconnecté',
      status_updated: 'Statut mis à jour'
    };
    return labels[event.type] ?? event.type;
  }

  startConsultation(): void {
    if (!this.consultation) {
      return;
    }

    const sub = this.consultationService.startConsultation(this.consultation.appointmentId).subscribe({
      next: (response) => {
        this.consultation = response.consultation;
        this.token = response.token ?? this.token;
        this.roomUrl = response.roomUrl ?? this.roomUrl;
        this.snackBar.open('La consultation est démarrée', 'Fermer', { duration: 3000 });
      },
      error: () => this.snackBar.open('Erreur lors du démarrage de la consultation', 'Fermer', { duration: 4000 })
    });

    this.subscriptions.push(sub);
  }

  toggleSummaryForm(): void {
    this.showSummaryForm = !this.showSummaryForm;
  }

  handleSummarySubmit(payload: CompleteConsultationDto): void {
    if (!this.consultation) {
      return;
    }

    const sub = this.consultationService
      .completeConsultation(this.consultation.appointmentId, payload)
      .subscribe({
        next: (updated) => {
          this.consultation = updated;
          this.showSummaryForm = false;
          this.snackBar.open('Compte rendu enregistré et consultation clôturée', 'Fermer', { duration: 4000 });
        },
        error: () => this.snackBar.open('Impossible d\'enregistrer le compte rendu', 'Fermer', { duration: 4000 })
      });

    this.subscriptions.push(sub);
  }

  handleSummaryCancel(): void {
    this.showSummaryForm = false;
  }

  leaveRoom(): void {
    this.router.navigate(['/consultations']);
  }
}
