import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';

import { AppointmentService } from '@app/core/services/appointment.service';
import { AuthService } from '@app/core/services/auth.service';
import { Appointment, AppointmentStatus, User, UserRole } from '@app/core/models';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';

interface StatusOption {
  label: string;
  value: AppointmentStatus | 'ALL';
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    ConfirmDialogComponent
  ],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsComponent implements OnInit, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly AppointmentStatus = AppointmentStatus;
  readonly statusOptions: StatusOption[] = [
    { label: 'Tous les statuts', value: 'ALL' },
    { label: 'En attente', value: AppointmentStatus.PENDING },
    { label: 'Confirmé', value: AppointmentStatus.CONFIRMED },
    { label: 'Annulé', value: AppointmentStatus.CANCELLED },
    { label: 'Terminé', value: AppointmentStatus.COMPLETED },
    { label: 'Absent', value: AppointmentStatus.NO_SHOW }
  ];

  readonly displayedColumns: string[] = [
    'appointmentDate',
    'doctor',
    'patient',
    'reason',
    'status',
    'duration',
    'actions'
  ];

  filterForm: FormGroup;
  dataSource = new MatTableDataSource<Appointment>([]);
  loading = false;
  private allAppointments: Appointment[] = [];
  private currentUser: User | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly appointmentService: AppointmentService,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      status: ['ALL'],
      search: [''],
      dateRange: this.fb.group({
        start: [null],
        end: [null]
      })
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadAppointments();
        }
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilters(): void {
    this.loadAppointments();
  }

  clearFilters(): void {
    this.filterForm.reset({
      status: 'ALL',
      search: '',
      dateRange: { start: null, end: null }
    });
    this.loadAppointments();
  }

  hasActiveFilters(): boolean {
    const { status, search, dateRange } = this.filterForm.value;
    return (
      status !== 'ALL' ||
      (search && search.trim().length > 0) ||
      !!dateRange?.start ||
      !!dateRange?.end
    );
  }

  refresh(): void {
    this.loadAppointments();
  }

  exportCsv(): void {
    if (typeof window === 'undefined' || this.dataSource.data.length === 0) {
      return;
    }

    const headers = ['Date', 'Médecin', 'Patient', 'Motif', 'Statut', 'Durée'];
    const rows = this.dataSource.data.map((appointment) => [
      this.formatDate(appointment.appointmentDate),
      `Dr. ${appointment.doctor?.firstName ?? ''} ${appointment.doctor?.lastName ?? ''}`.trim(),
      `${appointment.patient?.firstName ?? ''} ${appointment.patient?.lastName ?? ''}`.trim(),
      appointment.reason,
      this.getStatusLabel(appointment.status),
      `${appointment.duration ?? 30} min`
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${(value ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rendez-vous_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  cancelAppointment(appointmentId: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Annuler le rendez-vous',
          message: 'Confirmez-vous l\'annulation de ce rendez-vous ?',
          confirmLabel: 'Annuler',
          icon: 'cancel'
        },
        autoFocus: false,
        restoreFocus: false
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.appointmentService.cancelAppointment(appointmentId).subscribe({
          next: () => {
            this.snackBar.open('Rendez-vous annulé', 'Fermer', { duration: 3000 });
            this.loadAppointments();
          },
          error: () => {
            this.snackBar.open('Erreur lors de l\'annulation du rendez-vous', 'Fermer', { duration: 3000 });
          }
        });
      });
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'En attente',
      [AppointmentStatus.CONFIRMED]: 'Confirmé',
      [AppointmentStatus.CANCELLED]: 'Annulé',
      [AppointmentStatus.COMPLETED]: 'Terminé',
      [AppointmentStatus.NO_SHOW]: 'Absent'
    };
    return labels[status];
  }

  getStatusColor(status: AppointmentStatus): 'primary' | 'accent' | 'warn' | undefined {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'primary';
      case AppointmentStatus.COMPLETED:
        return 'accent';
      case AppointmentStatus.CANCELLED:
      case AppointmentStatus.NO_SHOW:
        return 'warn';
      default:
        return undefined;
    }
  }

  trackByAppointment(_: number, appointment: Appointment): string {
    return appointment.id;
  }

  private loadAppointments(): void {
    if (!this.currentUser) {
      return;
    }

    const statusValue = this.filterForm.get('status')?.value as AppointmentStatus | 'ALL';
    const statusParam = statusValue && statusValue !== 'ALL' ? statusValue : undefined;

    this.loading = true;

    const request$ = this.currentUser.role === UserRole.ADMIN
      ? this.appointmentService.getAllAppointments(statusParam)
      : this.appointmentService.getMyAppointments(statusParam);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.allAppointments = response.appointments ?? [];
          this.filterAppointments();
          this.loading = false;
        },
        error: () => {
          this.allAppointments = [];
          this.dataSource.data = [];
          this.loading = false;
          this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
        }
      });
  }

  private filterAppointments(): void {
    const { status, search, dateRange } = this.filterForm.value as {
      status: AppointmentStatus | 'ALL';
      search: string;
      dateRange: { start: Date | null; end: Date | null };
    };

    let filtered = [...this.allAppointments];

    if (status && status !== 'ALL') {
      filtered = filtered.filter((appointment) => appointment.status === status);
    }

    if (dateRange?.start || dateRange?.end) {
      const startTime = dateRange.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : undefined;
      const endTime = dateRange.end ? new Date(dateRange.end).setHours(23, 59, 59, 999) : undefined;

      filtered = filtered.filter((appointment) => {
        const time = new Date(appointment.appointmentDate).getTime();
        if (startTime && time < startTime) {
          return false;
        }
        if (endTime && time > endTime) {
          return false;
        }
        return true;
      });
    }

    if (search && search.trim().length > 0) {
      const lowered = search.trim().toLowerCase();
      filtered = filtered.filter((appointment) => {
        const haystack = [
          appointment.reason,
          appointment.notes,
          appointment.doctor?.firstName,
          appointment.doctor?.lastName,
          appointment.patient?.firstName,
          appointment.patient?.lastName
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(lowered);
      });
    }

    this.dataSource.data = filtered;

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  private formatDate(dateIso: string): string {
    return new Date(dateIso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
