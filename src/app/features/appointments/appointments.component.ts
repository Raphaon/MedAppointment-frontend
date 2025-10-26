import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Inject } from '@angular/core';
import { AppointmentService } from '@app/core/services/appointment.service';
import { AuthService } from '@app/core/services/auth.service';
import { Appointment, AppointmentStatus, User, UserRole } from '@app/core/models';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="appointments-container">
      <div class="header">
        <div>
          <h1>📅 Mes Rendez-vous</h1>
          <p class="subtitle">Gérez, reprogrammez ou mettez à jour vos consultations.</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="status-filter">
            <mat-label>Filtrer par statut</mat-label>
            <mat-select [value]="statusFilter" (selectionChange)="onStatusFilterChange($event.value)">
              <mat-option value="ALL">Tous</mat-option>
              <mat-option *ngFor="let status of statusOptions" [value]="status">
                {{ getStatusLabel(status) }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button color="primary" routerLink="/appointments/create">
            <mat-icon>add</mat-icon>
            Nouveau RDV
          </button>
          <button mat-raised-button color="primary" routerLink="/dashboard">
            <mat-icon>arrow_back</mat-icon>
            Retour
          </button>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <mat-icon>hourglass_empty</mat-icon>
        <p>Chargement des rendez-vous...</p>
      </div>

      <div class="appointments-list" *ngIf="!loading && filteredAppointments.length > 0; else emptyState">
        <table mat-table [dataSource]="filteredAppointments" class="mat-elevation-z2" [trackBy]="trackByAppointment">

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let appointment">
              <div class="date-cell">
                <mat-icon>event</mat-icon>
                {{ appointment.appointmentDate | date:'dd/MM/yyyy HH:mm' }}
              </div>
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
            <td mat-cell *matCellDef="let appointment">
              <span class="reason" [matTooltip]="appointment.notes || appointment.reason">
                {{ appointment.reason }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let appointment">
              <mat-chip [color]="getStatusColor(appointment.status)" selected>
                <mat-icon>{{ getStatusIcon(appointment.status) }}</mat-icon>
                {{ getStatusLabel(appointment.status) }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let appointment" class="actions-cell">
              <button
                mat-icon-button
                color="primary"
                matTooltip="Reprogrammer le rendez-vous"
                (click)="openRescheduleDialog(appointment)"
                [disabled]="!canReschedule(appointment)">
                <mat-icon>schedule</mat-icon>
              </button>

              <button
                mat-icon-button
                color="warn"
                matTooltip="Annuler le rendez-vous"
                (click)="cancelAppointment(appointment)"
                [disabled]="!canCancel(appointment)">
                <mat-icon>cancel</mat-icon>
              </button>

              <button
                mat-icon-button
                [matMenuTriggerFor]="statusMenu"
                matTooltip="Mettre à jour le statut"
                *ngIf="canShowStatusMenu() && getStatusActions(appointment).length > 0">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #statusMenu="matMenu">
                <button mat-menu-item *ngFor="let status of getStatusActions(appointment)" (click)="updateStatus(appointment, status)">
                  <mat-icon>{{ getStatusIcon(status) }}</mat-icon>
                  <span>{{ getStatusLabel(status) }}</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>

      <ng-template #emptyState>
        <div class="no-data">
          <mat-icon>event_busy</mat-icon>
          <p>Aucun rendez-vous trouvé pour ce filtre.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .appointments-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .subtitle {
      margin: 4px 0 0;
      color: #666;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .status-filter {
      min-width: 220px;
    }

    .appointments-list {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    th {
      text-transform: uppercase;
      font-size: 12px;
      color: #777;
    }

    .date-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .date-cell mat-icon {
      color: #667eea;
    }

    .reason {
      display: inline-block;
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    mat-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .actions-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
      margin-top: 24px;
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

    .loading {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .loading mat-icon {
      color: #667eea;
    }

    @media (max-width: 960px) {
      .status-filter {
        width: 100%;
      }

      .header-actions {
        justify-content: flex-start;
      }

      table {
        font-size: 14px;
      }
    }
  `]
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  displayedColumns: string[] = ['date', 'doctor', 'patient', 'reason', 'status', 'actions'];
  statusFilter: AppointmentStatus | 'ALL' = 'ALL';
  readonly statusOptions = Object.values(AppointmentStatus);
  loading = false;
  currentUser: User | null = null;
  readonly AppointmentStatus = AppointmentStatus;
  readonly UserRole = UserRole;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.loadAppointments();
  }

  trackByAppointment(index: number, appointment: Appointment): string {
    return appointment.id;
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getMyAppointments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.appointments = response.appointments;
          this.applyStatusFilter();
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
        }
      });
  }

  onStatusFilterChange(value: AppointmentStatus | 'ALL'): void {
    this.statusFilter = value;
    this.applyStatusFilter();
  }

  applyStatusFilter(): void {
    if (this.statusFilter === 'ALL') {
      this.filteredAppointments = [...this.appointments];
      return;
    }

    this.filteredAppointments = this.appointments.filter(appointment => appointment.status === this.statusFilter);
  }

  openRescheduleDialog(appointment: Appointment): void {
    if (!this.canReschedule(appointment)) {
      return;
    }

    const dialogRef = this.dialog.open(RescheduleDialogComponent, {
      width: '420px',
      data: { appointment }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.appointmentService.updateAppointment(appointment.id, result)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.snackBar.open('Rendez-vous reprogrammé', 'Fermer', { duration: 3000 });
                this.loadAppointments();
              },
              error: () => {
                this.snackBar.open('Impossible de reprogrammer le rendez-vous', 'Fermer', { duration: 4000 });
              }
            });
        }
      });
  }

  cancelAppointment(appointment: Appointment): void {
    if (!this.canCancel(appointment)) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '360px',
      data: {
        title: 'Annulation du rendez-vous',
        description: 'Confirmez-vous l\'annulation de ce rendez-vous ?'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.appointmentService.cancelAppointment(appointment.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.snackBar.open('Rendez-vous annulé', 'Fermer', { duration: 3000 });
                this.loadAppointments();
              },
              error: () => {
                this.snackBar.open('Erreur lors de l\'annulation', 'Fermer', { duration: 3000 });
              }
            });
        }
      });
  }

  updateStatus(appointment: Appointment, status: AppointmentStatus): void {
    if (appointment.status === status) {
      return;
    }

    this.appointmentService.updateAppointment(appointment.id, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Statut mis à jour', 'Fermer', { duration: 3000 });
          this.loadAppointments();
        },
        error: () => {
          this.snackBar.open('Impossible de mettre à jour le statut', 'Fermer', { duration: 4000 });
        }
      });
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'En attente',
      [AppointmentStatus.CONFIRMED]: 'Confirmé',
      [AppointmentStatus.CANCELLED]: 'Annulé',
      [AppointmentStatus.COMPLETED]: 'Terminé',
      [AppointmentStatus.NO_SHOW]: 'Absence'
    };

    return labels[status];
  }

  getStatusColor(status: AppointmentStatus): 'primary' | 'accent' | 'warn' | undefined {
    const colors: Record<AppointmentStatus, 'primary' | 'accent' | 'warn' | undefined> = {
      [AppointmentStatus.PENDING]: 'accent',
      [AppointmentStatus.CONFIRMED]: 'primary',
      [AppointmentStatus.CANCELLED]: 'warn',
      [AppointmentStatus.COMPLETED]: undefined,
      [AppointmentStatus.NO_SHOW]: 'warn'
    };

    return colors[status];
  }

  getStatusIcon(status: AppointmentStatus): string {
    const icons: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'schedule',
      [AppointmentStatus.CONFIRMED]: 'check_circle',
      [AppointmentStatus.CANCELLED]: 'cancel',
      [AppointmentStatus.COMPLETED]: 'task_alt',
      [AppointmentStatus.NO_SHOW]: 'report'
    };

    return icons[status];
  }

  canShowStatusMenu(): boolean {
    const role = this.currentUser?.role;
    return role === UserRole.DOCTOR || role === UserRole.ADMIN;
  }

  canCancel(appointment: Appointment): boolean {
    return ![AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW].includes(appointment.status);
  }

  canReschedule(appointment: Appointment): boolean {
    return ![AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW].includes(appointment.status);
  }

  getStatusActions(appointment: Appointment): AppointmentStatus[] {
    if (!this.canShowStatusMenu()) {
      return [];
    }

    const available: AppointmentStatus[] = [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.NO_SHOW,
      AppointmentStatus.CANCELLED
    ];

    return available.filter(status => status !== appointment.status);
  }
}

interface RescheduleDialogData {
  appointment: Appointment;
}

@Component({
  selector: 'app-reschedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Reprogrammer le rendez-vous</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Nouvelle date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Horaire</mat-label>
          <input matInput type="time" formControlName="time">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Durée (minutes)</mat-label>
          <input matInput type="number" min="15" step="5" formControlName="duration">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput rows="3" formControlName="notes"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">Annuler</button>
      <button mat-raised-button color="primary" (click)="close(true)" [disabled]="form.invalid">Reprogrammer</button>
    </div>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 8px;
    }
  `]
})
export class RescheduleDialogComponent {
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RescheduleDialogData,
    private readonly dialogRef: MatDialogRef<RescheduleDialogComponent>,
    private readonly fb: FormBuilder
  ) {
    const currentDate = new Date(data.appointment.appointmentDate);
    const time = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;

    this.form = this.fb.group({
      date: [currentDate, Validators.required],
      time: [time, Validators.required],
      duration: [data.appointment.duration || 30, [Validators.required, Validators.min(15)]],
      notes: [data.appointment.notes || '']
    });
  }

  close(shouldSubmit: boolean): void {
    if (!shouldSubmit) {
      this.dialogRef.close();
      return;
    }

    const { date, time, duration, notes } = this.form.value;
    const [hours, minutes] = (time as string).split(':').map(Number);
    const combined = new Date(date as Date);
    combined.setHours(hours, minutes, 0, 0);

    this.dialogRef.close({
      appointmentDate: combined.toISOString(),
      duration,
      notes
    });
  }
}

interface ConfirmActionDialogData {
  title: string;
  description: string;
}

@Component({
  selector: 'app-confirm-action-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content class="dialog-content">
      <mat-icon color="warn">warning</mat-icon>
      <p>{{ data.description }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Retour</button>
      <button mat-raised-button color="warn" (click)="dialogRef.close(true)">Confirmer</button>
    </div>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 0 16px;
    }
  `]
})
export class ConfirmActionDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmActionDialogData,
    public readonly dialogRef: MatDialogRef<ConfirmActionDialogComponent>
  ) {}
}
