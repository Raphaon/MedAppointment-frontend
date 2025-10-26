import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentService } from '@app/core/services/appointment.service';
import { Appointment, AppointmentStatus } from '@app/core/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, shareReplay, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="appointments-container">
      <div class="header">
        <h1>📅 Mes Rendez-vous</h1>
        <button mat-raised-button color="primary" routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Retour
        </button>
      </div>

      <ng-container *ngIf="appointments$ | async as appointments">
        <div class="appointments-list" *ngIf="appointments.length > 0; else noAppointments">
          <table mat-table [dataSource]="appointments" class="mat-elevation-z2">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let appointment">
                {{ appointment.appointmentDate | date:'dd/MM/yyyy HH:mm' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="doctor">
              <th mat-header-cell *matHeaderCellDef>Médecin</th>
              <td mat-cell *matCellDef="let appointment">
                Dr. {{ appointment.doctor?.firstName }} {{ appointment.doctor?.lastName }}
              </td>
            </ng-container>

            <ng-container matColumnDef="patient">
              <th mat-header-cell *matHeaderCellDef>Patient</th>
              <td mat-cell *matCellDef="let appointment">
                {{ appointment.patient?.firstName }} {{ appointment.patient?.lastName }}
              </td>
            </ng-container>

            <ng-container matColumnDef="reason">
              <th mat-header-cell *matHeaderCellDef>Motif</th>
              <td mat-cell *matCellDef="let appointment">{{ appointment.reason }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let appointment">
                <mat-chip [color]="getStatusColor(appointment.status)" selected>
                  {{ getStatusLabel(appointment.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let appointment">
                <button mat-icon-button color="warn"
                        (click)="cancelAppointment(appointment.id)"
                        *ngIf="appointment.status !== 'CANCELLED'">
                  <mat-icon>cancel</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
      </ng-container>

      <ng-template #noAppointments>
        <div class="no-data">
          <mat-icon>event_busy</mat-icon>
          <p>Aucun rendez-vous trouvé</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .appointments-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .appointments-list {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
    }

    .no-data mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #ccc;
    }

    .no-data p {
      color: #666;
      font-size: 18px;
      margin-top: 16px;
    }
  `]
})
export class AppointmentsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshSubject = new Subject<void>();

  displayedColumns: string[] = ['date', 'doctor', 'patient', 'reason', 'status', 'actions'];
  appointments$: Observable<Appointment[]> = this.refreshSubject.pipe(
    startWith(void 0),
    switchMap(() =>
      this.appointmentService.getMyAppointments().pipe(
        map(response => response.appointments ?? []),
        catchError(() => {
          this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
          return of([]);
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {}

  cancelAppointment(id: string): void {
    if (confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) {
      this.appointmentService.cancelAppointment(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackBar.open('Rendez-vous annulé', 'Fermer', { duration: 3000 });
            this.refreshSubject.next();
          },
          error: () => {
            this.snackBar.open('Erreur lors de l\'annulation', 'Fermer', { duration: 3000 });
          }
        });
    }
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmé',
      CANCELLED: 'Annulé',
      COMPLETED: 'Terminé',
      NO_SHOW: 'Absence'
    };
    return labels[status];
  }

  getStatusColor(status: AppointmentStatus): string {
    const colors = {
      PENDING: 'accent',
      CONFIRMED: 'primary',
      CANCELLED: 'warn',
      COMPLETED: '',
      NO_SHOW: 'warn'
    };
    return colors[status];
  }
}
