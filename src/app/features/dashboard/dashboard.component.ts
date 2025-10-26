import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationCenterComponent } from '@app/shared/components/notification-center.component';
import { User, UserRole, Appointment, AppointmentStatus } from '@app/core/models';
<<<<<<< HEAD
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
=======
import { DashboardState, StatCard } from './dashboard.state';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
>>>>>>> remotes/origin/codex/refactor-dashboard-and-appointment-components

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

<<<<<<< HEAD
=======
      <div class="dashboard-content">
        <div class="welcome-section">
          <h1>👋 Bienvenue, {{ currentUser?.firstName }} !</h1>
          <p class="subtitle">{{ getWelcomeMessage() }}</p>
        </div>

        <!-- Statistiques -->
        <div class="stats-grid" *ngIf="stats$ | async as stats">
          <mat-card *ngFor="let stat of stats; trackBy: trackByStat"
                    class="stat-card"
                    [style.border-left-color]="stat.color"
                    [routerLink]="stat.route"
                    [class.clickable]="stat.route">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon [style.color]="stat.color">{{ stat.icon }}</mat-icon>
                <span class="stat-value">{{ stat.value }}</span>
              </div>
              <p class="stat-title">{{ stat.title }}</p>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Actions rapides selon le rôle -->
        <div class="actions-section">
          <h2>Actions rapides</h2>
          <div class="actions-grid">
            
            <!-- Actions Patient -->
            <ng-container *ngIf="currentUser?.role === UserRole.PATIENT">
              <mat-card class="action-card" routerLink="/doctors">
                <mat-icon color="primary">search</mat-icon>
                <h3>Trouver un médecin</h3>
                <p>Parcourez notre liste de médecins qualifiés</p>
              </mat-card>

              <mat-card class="action-card" routerLink="/appointments/create">
                <mat-icon color="accent">event</mat-icon>
                <h3>Prendre RDV</h3>
                <p>Réservez un rendez-vous avec votre médecin</p>
              </mat-card>

              <mat-card class="action-card" routerLink="/appointments">
                <mat-icon color="warn">list</mat-icon>
                <h3>Mes rendez-vous</h3>
                <p>Consultez vos rendez-vous à venir</p>
              </mat-card>

              <mat-card class="action-card" routerLink="/profile">
                <mat-icon>person</mat-icon>
                <h3>Mon profil</h3>
                <p>Gérez vos informations médicales</p>
              </mat-card>
            </ng-container>

            <!-- Actions Médecin -->
            <ng-container *ngIf="currentUser?.role === UserRole.DOCTOR">
              <mat-card class="action-card" routerLink="/calendar">
                <mat-icon color="primary">calendar_month</mat-icon>
                <h3>Mon calendrier</h3>
                <p>Vue calendrier de vos rendez-vous</p>
              </mat-card>

              <mat-card class="action-card" routerLink="/appointments">
                <mat-icon color="accent">event</mat-icon>
                <h3>Mes consultations</h3>
                <p>Gérez vos rendez-vous patients</p>
              </mat-card>

              <mat-card class="action-card" routerLink="/profile">
                <mat-icon color="warn">local_hospital</mat-icon>
                <h3>Mon profil médecin</h3>
                <p>Mettez à jour vos informations professionnelles</p>
              </mat-card>
            </ng-container>

            <!-- Actions Admin -->
            <ng-container *ngIf="currentUser?.role === UserRole.ADMIN">
              <mat-card class="action-card" routerLink="/users">
                <mat-icon color="primary">people</mat-icon>
                <h3>Utilisateurs</h3>
                <p>Gérez les utilisateurs de la plateforme</p>
              </mat-card>

              <mat-card class="action-card" routerLink="/appointments">
                <mat-icon color="accent">event</mat-icon>
                <h3>Tous les RDV</h3>
                <p>Supervisez tous les rendez-vous</p>
              </mat-card>

              <mat-card class="action-card" routerLink="/doctors">
                <mat-icon color="warn">local_hospital</mat-icon>
                <h3>Médecins</h3>
                <p>Liste des médecins inscrits</p>
              </mat-card>
            </ng-container>
          </div>
        </div>

        <!-- Prochains RDV -->
        <ng-container *ngIf="upcomingAppointments$ | async as upcomingAppointments">
          <div class="upcoming-section" *ngIf="upcomingAppointments.length > 0">
            <h2>📅 Prochains rendez-vous</h2>
            <div class="appointments-list">
              <mat-card *ngFor="let appointment of upcomingAppointments; trackBy: trackByAppointment" class="appointment-card">
                <div class="appointment-date">
                  <div class="day">{{ getDay(appointment.appointmentDate) }}</div>
                  <div class="month">{{ getMonth(appointment.appointmentDate) }}</div>
                </div>
                <div class="appointment-details">
                  <h3>{{ getAppointmentTitle(appointment) }}</h3>
                  <p class="time">
                    <mat-icon>schedule</mat-icon>
                    {{ getTime(appointment.appointmentDate) }}
                  </p>
                  <p class="reason">{{ appointment.reason }}</p>
                </div>
                <div class="appointment-status">
                  <span class="status-badge" [class]="appointment.status.toLowerCase()">
                    {{ getStatusLabel(appointment.status) }}
                  </span>
                </div>
              </mat-card>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: #f5f5f5;
    }

    .toolbar {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 10;
    }

    .logo {
      font-size: 20px;
      font-weight: bold;
    }

    .spacer {
      flex: 1;
    }

    .user-info {
      padding: 16px;
      background-color: #f5f5f5;
    }

    .user-name {
      margin: 0;
      font-weight: bold;
      color: #333;
    }

    .user-role {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #666;
    }

    .dashboard-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .welcome-section {
      margin-bottom: 32px;
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .welcome-section h1 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 32px;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      border-left: 4px solid;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: default;
    }

    .stat-card.clickable {
      cursor: pointer;
    }

    .stat-card.clickable:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .stat-header mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #333;
    }

    .stat-title {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .actions-section, .upcoming-section {
      margin-bottom: 32px;
    }

    .actions-section h2, .upcoming-section h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }

    .action-card {
      text-align: center;
      padding: 32px 24px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .action-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      border-color: #667eea;
    }

    .action-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .action-card h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 18px;
    }

    .action-card p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .appointment-card {
      display: flex;
      gap: 20px;
      align-items: center;
      padding: 20px;
      transition: transform 0.2s;
    }

    .appointment-card:hover {
      transform: translateX(8px);
    }

    .appointment-date {
      text-align: center;
      min-width: 60px;
    }

    .day {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      line-height: 1;
    }

    .month {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
    }

    .appointment-details {
      flex: 1;
    }

    .appointment-details h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .appointment-details .time {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0 0 4px 0;
      color: #666;
      font-size: 14px;
    }

    .appointment-details .time mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .appointment-details .reason {
      margin: 0;
      color: #999;
      font-size: 13px;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .status-badge.pending {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-badge.confirmed {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.cancelled {
      background-color: #f8d7da;
      color: #721c24;
    }
  `]
>>>>>>> remotes/origin/codex/refactor-dashboard-and-appointment-components
})
export class DashboardComponent {
  private readonly destroyRef = inject(DestroyRef);

  currentUser: User | null = this.authService.getCurrentUser();
  UserRole = UserRole;
<<<<<<< HEAD
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
=======
  stats$ = this.dashboardState.stats$;
  upcomingAppointments$ = this.dashboardState.upcomingAppointments$;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardState: DashboardState
  ) {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user: User | null) => {
        this.currentUser = user;
      });
>>>>>>> remotes/origin/codex/refactor-dashboard-and-appointment-components
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

  trackByStat(_index: number, stat: StatCard): string {
    return stat.title;
  }

  trackByAppointment(_index: number, appointment: Appointment): string {
    return appointment.id || appointment.appointmentDate;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}