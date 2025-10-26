import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService } from '@app/core/services/appointment.service';
import { Appointment, AppointmentStatus } from '@app/core/models';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';
import { take, debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ConfirmDialogComponent
  ],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['appointmentDate', 'doctor', 'patient', 'reason', 'status', 'duration', 'actions'];
  dataSource = new MatTableDataSource<Appointment>([]);
  originalAppointments: Appointment[] = [];
  filterForm: FormGroup;
  loading = false;
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: AppointmentStatus.PENDING, label: 'En attente' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmé' },
    { value: AppointmentStatus.COMPLETED, label: 'Terminé' },
    { value: AppointmentStatus.CANCELLED, label: 'Annulé' },
    { value: AppointmentStatus.NO_SHOW, label: 'Absence' }
  ];

  AppointmentStatus = AppointmentStatus;

  private filterSub?: Subscription;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      search: [''],
      dateRange: this.fb.group({
        start: [null],
        end: [null]
      })
    });

    this.dataSource.sortingDataAccessor = (item: Appointment, property: string) => {
      switch (property) {
        case 'appointmentDate':
          return new Date(item.appointmentDate).getTime();
        case 'doctor':
          return `${item.doctor?.lastName || ''} ${item.doctor?.firstName || ''}`.toLowerCase();
        case 'patient':
          return `${item.patient?.lastName || ''} ${item.patient?.firstName || ''}`.toLowerCase();
        case 'reason':
          return item.reason?.toLowerCase() || '';
        case 'duration':
          return item.duration ?? 0;
        default:
          return (item as Record<string, any>)[property] ?? '';
      }
    };
  }

  ngOnInit(): void {
    this.loadAppointments();
    this.filterSub = this.filterForm.valueChanges
      .pipe(debounceTime(200))
      .subscribe(() => this.applyFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getMyAppointments().subscribe({
      next: (response) => {
        this.originalAppointments = response.appointments || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
      }
    });
  }

  applyFilters(): void {
    const { status, search, dateRange } = this.filterForm.value;
    let filtered = [...this.originalAppointments];

    if (status) {
      filtered = filtered.filter((appointment) => appointment.status === status);
    }

    if (dateRange?.start || dateRange?.end) {
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        if (start && appointmentDate < start) {
          return false;
        }
        if (end) {
          const inclusiveEnd = new Date(end);
          inclusiveEnd.setHours(23, 59, 59, 999);
          if (appointmentDate > inclusiveEnd) {
            return false;
          }
        }
        return true;
      });
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter((appointment) => {
        const doctorName = `${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.toLowerCase();
        const patientName = `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.toLowerCase();
        const reason = appointment.reason?.toLowerCase() || '';
        return doctorName.includes(term) || patientName.includes(term) || reason.includes(term);
      });
    }

    filtered.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

    this.dataSource.data = filtered;
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.filterForm.reset({
      status: '',
      search: '',
      dateRange: {
        start: null,
        end: null
      }
    });
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    const { status, search, dateRange } = this.filterForm.value;
    return !!(status || (search && search.trim()) || dateRange?.start || dateRange?.end);
  }

  refresh(): void {
    this.loadAppointments();
  }

  exportCsv(): void {
    const data = this.dataSource.data;

    if (!data.length) {
      this.snackBar.open('Aucun rendez-vous à exporter', 'Fermer', { duration: 3000 });
      return;
    }

    const header = 'Date;Médecin;Patient;Statut;Durée (min);Motif';
    const rows = data.map((appointment) => {
      const date = new Date(appointment.appointmentDate).toLocaleString('fr-FR');
      const doctor = this.formatUserName(appointment.doctor);
      const patient = this.formatUserName(appointment.patient);
      const statusLabel = this.getStatusLabel(appointment.status);
      const duration = appointment.duration ?? '';
      const reason = appointment.reason?.replace(/\s+/g, ' ') ?? '';
      return `${date};${doctor};${patient};${statusLabel};${duration};"${reason.replace(/"/g, '""')}"`;
    });

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rendez-vous-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  cancelAppointment(id: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Annuler le rendez-vous',
        message: 'Voulez-vous vraiment annuler ce rendez-vous ? Cette action est irréversible.',
        confirmLabel: 'Annuler le rendez-vous',
        icon: 'event_busy'
      },
      autoFocus: false,
      restoreFocus: false
    }).afterClosed().pipe(take(1)).subscribe((confirmed) => {
      if (confirmed) {
        this.appointmentService.cancelAppointment(id).subscribe({
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

  getStatusLabel(status: AppointmentStatus): string {
    const labels = {
      [AppointmentStatus.PENDING]: 'En attente',
      [AppointmentStatus.CONFIRMED]: 'Confirmé',
      [AppointmentStatus.CANCELLED]: 'Annulé',
      [AppointmentStatus.COMPLETED]: 'Terminé',
      [AppointmentStatus.NO_SHOW]: 'Absence'
    } as Record<AppointmentStatus, string>;
    return labels[status] ?? status;
  }

  getStatusColor(status: AppointmentStatus): string {
    const colors = {
      [AppointmentStatus.PENDING]: 'accent',
      [AppointmentStatus.CONFIRMED]: 'primary',
      [AppointmentStatus.CANCELLED]: 'warn',
      [AppointmentStatus.COMPLETED]: 'primary',
      [AppointmentStatus.NO_SHOW]: 'warn'
    } as Record<AppointmentStatus, string>;
    return colors[status] ?? '';
  }

  trackByAppointment(_: number, appointment: Appointment): string {
    return appointment.id;
  }

  private formatUserName(user: any | undefined): string {
    if (!user) {
      return '—';
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
}
