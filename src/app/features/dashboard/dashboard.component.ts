import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@app/core/services/auth.service';
import { AppointmentService } from '@app/core/services/appointment.service';
import { NotificationCenterComponent } from '@app/shared/components/notification-center.component';
import { User, UserRole, Appointment, AppointmentStatus } from '@app/core/models';
import { StatCardComponent } from '@app/shared/components/stat-card/stat-card.component';
import { UserService } from '@app/core/services/user.service';
import { DoctorService } from '@app/core/services/doctor.service';
import { forkJoin } from 'rxjs';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatDividerModule,
    NotificationCenterComponent,
    StatCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']

})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  UserRole = UserRole;
  stats: StatCard[] = [];
  upcomingAppointments: Appointment[] = [];
  private adminStatsLoaded = false;

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private router: Router,
    private userService: UserService,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      if (user) {
        this.loadDashboardData();
      }
    });
  }

  private loadDashboardData(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (response: any) => {
        const appointments = response.appointments || [];
        this.upcomingAppointments = this.extractUpcomingAppointments(appointments);
        this.buildStats(appointments);
      },
      error: (error: any) => {
        console.error('Erreur chargement des données du tableau de bord:', error);
      }
    });
  }

  private extractUpcomingAppointments(appointments: Appointment[]): Appointment[] {
    const now = new Date();

    return appointments
      .filter((a: Appointment) => new Date(a.appointmentDate) > now)
      .sort((a: Appointment, b: Appointment) =>
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      )
      .slice(0, 3);
  }

  private buildStats(appointments: Appointment[]): void {
    if (!this.currentUser) {
      this.stats = [];
      return;
    }

    if (this.currentUser.role === UserRole.PATIENT) {
      this.stats = [
        {
          title: 'Rendez-vous à venir',
          value: appointments.filter((a: Appointment) =>
            a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.PENDING
          ).length,
          icon: 'event',
          color: '#4caf50',
          route: '/appointments'
        },
        {
          title: 'Consultations passées',
          value: appointments.filter((a: Appointment) =>
            a.status === AppointmentStatus.COMPLETED
          ).length,
          icon: 'history',
          color: '#2196f3'
        },
        {
          title: 'Total rendez-vous',
          value: appointments.length,
          icon: 'calendar_today',
          color: '#ff9800'
        }
      ];
      return;
    }

    if (this.currentUser.role === UserRole.DOCTOR) {
      this.stats = [
        {
          title: 'Patients aujourd\'hui',
          value: appointments.filter((a: Appointment) =>
            this.isToday(new Date(a.appointmentDate))
          ).length,
          icon: 'people',
          color: '#4caf50',
          route: '/calendar'
        },
        {
          title: 'En attente',
          value: appointments.filter((a: Appointment) =>
            a.status === AppointmentStatus.PENDING
          ).length,
          icon: 'schedule',
          color: '#ff9800',
          route: '/appointments'
        },
        {
          title: 'Total consultations',
          value: appointments.length,
          icon: 'local_hospital',
          color: '#2196f3'
        }
      ];
      return;
    }

    if (this.currentUser.role === UserRole.ADMIN) {
      this.stats = [
        {
          title: 'Total rendez-vous',
          value: appointments.length,
          icon: 'event',
          color: '#4caf50',
          route: '/appointments'
        },
        {
          title: 'Utilisateurs',
          value: 0,
          icon: 'people',
          color: '#2196f3',
          route: '/users'
        },
        {
          title: 'Médecins actifs',
          value: 0,
          icon: 'local_hospital',
          color: '#ff9800',
          route: '/doctors'
        }
      ];
      this.loadAdminMetrics();
    }
  }

  private loadAdminMetrics(): void {
    if (this.adminStatsLoaded) {
      return;
    }

    this.adminStatsLoaded = true;

    forkJoin({
      users: this.userService.getAllUsers(),
      doctors: this.doctorService.getAllDoctors()
    }).subscribe({
      next: ({ users, doctors }) => {
        this.stats = this.stats.map((stat) => {
          if (stat.title === 'Utilisateurs') {
            return { ...stat, value: users.count ?? users.users.length };
          }
          if (stat.title === 'Médecins actifs') {
            return { ...stat, value: doctors.count ?? doctors.doctors.length };
          }
          return stat;
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des indicateurs administrateur:', error);
        this.adminStatsLoaded = false;
      }
    });
  }

  getRoleLabel(): string {
    const labels: any = {
      [UserRole.ADMIN]: 'Administrateur',
      [UserRole.DOCTOR]: 'Médecin',
      [UserRole.PATIENT]: 'Patient'
    };
    return labels[this.currentUser?.role || ''] || 'Utilisateur';
  }

  getWelcomeMessage(): string {
    const messages: any = {
      [UserRole.ADMIN]: 'Gérez votre plateforme médicale',
      [UserRole.DOCTOR]: 'Gérez vos consultations et patients',
      [UserRole.PATIENT]: 'Prenez soin de votre santé'
    };
    return messages[this.currentUser?.role || ''] || 'Bienvenue sur MedAppointment';
  }

  getAppointmentTitle(appointment: Appointment): string {
    if (this.currentUser?.role === UserRole.PATIENT) {
      return `Dr. ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}`;
    } else {
      return `${appointment.patient?.firstName} ${appointment.patient?.lastName}`;
    }
  }

  getDay(dateString: string): string {
    return new Date(dateString).getDate().toString();
  }

  getMonth(dateString: string): string {
    const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
    return months[new Date(dateString).getMonth()];
  }

  getTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels: any = {
      [AppointmentStatus.PENDING]: 'En attente',
      [AppointmentStatus.CONFIRMED]: 'Confirmé',
      [AppointmentStatus.CANCELLED]: 'Annulé',
      [AppointmentStatus.COMPLETED]: 'Terminé',
      [AppointmentStatus.NO_SHOW]: 'Absent'
    };
    return labels[status] || status;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}