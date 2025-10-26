import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';

import { AuthService } from '@app/core/services/auth.service';
import { ConsultationService } from '@app/core/services/consultation.service';
import { Consultation, ConsultationStatus, User } from '@app/core/models';

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './consultations.component.html',
  styleUrls: ['./consultations.component.scss']
})
export class ConsultationsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['scheduledAt', 'patient', 'status', 'duration', 'actions'];
  dataSource = new MatTableDataSource<Consultation>([]);
  loading = false;
  startingConsultations = new Set<string>();
  private currentUser?: User | null;
  private subscriptions: Subscription[] = [];

  ConsultationStatus = ConsultationStatus;

  constructor(
    private authService: AuthService,
    private consultationService: ConsultationService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      const sub = this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadConsultations();
        }
      });
      this.subscriptions.push(sub);
      return;
    }

    this.loadConsultations();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadConsultations(): void {
    if (!this.currentUser) {
      return;
    }

    this.loading = true;
    const sub = this.consultationService.getDoctorConsultations(this.currentUser.id).subscribe({
      next: (consultations) => {
        this.dataSource.data = consultations ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Impossible de charger vos consultations', 'Fermer', { duration: 4000 });
      }
    });

    this.subscriptions.push(sub);
  }

  trackByConsultation(_: number, consultation: Consultation): string {
    return consultation.id;
  }

  getStatusLabel(status: ConsultationStatus): string {
    const labels: Record<ConsultationStatus, string> = {
      [ConsultationStatus.PLANNED]: 'Planifiée',
      [ConsultationStatus.IN_PROGRESS]: 'En cours',
      [ConsultationStatus.COMPLETED]: 'Terminée',
      [ConsultationStatus.CANCELLED]: 'Annulée'
    };
    return labels[status] ?? status;
  }

  getStatusColor(status: ConsultationStatus): 'primary' | 'accent' | 'warn' | undefined {
    switch (status) {
      case ConsultationStatus.IN_PROGRESS:
        return 'primary';
      case ConsultationStatus.CANCELLED:
        return 'warn';
      case ConsultationStatus.COMPLETED:
        return 'accent';
      default:
        return undefined;
    }
  }

  canStart(consultation: Consultation): boolean {
    return consultation.status === ConsultationStatus.PLANNED || consultation.status === ConsultationStatus.IN_PROGRESS;
  }

  startOrResumeConsultation(consultation: Consultation): void {
    if (this.startingConsultations.has(consultation.id)) {
      return;
    }

    if (consultation.status === ConsultationStatus.IN_PROGRESS) {
      this.router.navigate(['/consultations', consultation.id]);
      return;
    }

    this.startingConsultations.add(consultation.id);
    const sub = this.consultationService.startConsultation(consultation.appointmentId).subscribe({
      next: (response) => {
        this.startingConsultations.delete(consultation.id);
        const updated = response.consultation ?? consultation;
        this.snackBar.open('Consultation démarrée', 'Fermer', { duration: 3000 });
        this.router.navigate(['/consultations', updated.id], { queryParams: { token: response.token, roomUrl: response.roomUrl } });
        this.loadConsultations();
      },
      error: () => {
        this.startingConsultations.delete(consultation.id);
        this.snackBar.open('Erreur lors du démarrage de la consultation', 'Fermer', { duration: 4000 });
      }
    });

    this.subscriptions.push(sub);
  }

  openConsultation(consultation: Consultation): void {
    this.router.navigate(['/consultations', consultation.id]);
  }
}
