import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { AppointmentService } from '@app/core/services/appointment.service';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationCenterComponent } from '@app/shared/components/notification-center.component';
import { Appointment, AppointmentStatus, DoctorProfile, MedicalSpecialty, User, UserRole } from '@app/core/models';
import { DoctorService } from '@app/core/services/doctor.service';
import { UserService } from '@app/core/services/user.service';


interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  route?: string;
  format?: 'number' | 'percent' | 'currency';
}

interface ChartPoint {
  label: string;
  value: number;
  percent?: number;
}

interface DoctorInsights {
  weeklyCounts: ChartPoint[];
  maxWeeklyCount: number;
  statusDistribution: ChartPoint[];
  topPatients: ChartPoint[];
  revenueEstimate: number;
  presenceRate: number;
}

interface PatientInsights {
  historyTimeline: ChartPoint[];
  maxHistoryCount: number;
  favouriteDoctors: ChartPoint[];
  completionRate: number;
}

interface AdminInsights {
  appointmentTrend: ChartPoint[];
  maxAppointmentTrend: number;
  specialtyBreakdown: ChartPoint[];
  userBreakdown: ChartPoint[];
}

interface DashboardViewModel {
  user: User;
  stats: StatCard[];
  upcoming: Appointment[];
  doctorInsights?: DoctorInsights;
  patientInsights?: PatientInsights;
  adminInsights?: AdminInsights;
}
=======
import { DashboardState, StatCard } from './dashboard.state';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


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
  template: `
    <div class="dashboard-layout" *ngIf="viewModel$ | async as vm">
      <mat-toolbar color="primary" class="toolbar">
        <span class="logo">🏥 MedAppointment</span>
        <span class="spacer"></span>

        <app-notification-center></app-notification-center>

        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu">
          <div class="user-info">
            <p class="user-name">{{ vm.user.firstName }} {{ vm.user.lastName }}</p>
            <p class="user-role">{{ getRoleLabel(vm.user.role) }}</p>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Mon profil</span>
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Déconnexion</span>
          </button>
        </mat-menu>
      </mat-toolbar>

      <div class="dashboard-content">
        <div class="welcome-section">
          <h1>👋 Bienvenue, {{ vm.user.firstName }} !</h1>
          <p class="subtitle">{{ getWelcomeMessage(vm.user.role) }}</p>
        </div>

        <div class="stats-grid">
          <mat-card *ngFor="let stat of vm.stats; trackBy: trackByStat" class="stat-card" [style.border-left-color]="stat.color" [routerLink]="stat.route" [class.clickable]="!!stat.route">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon [style.color]="stat.color">{{ stat.icon }}</mat-icon>
                <span class="stat-value">
                  <ng-container [ngSwitch]="stat.format">
                    <span *ngSwitchCase="'currency'">{{ stat.value | currency:'EUR':'symbol':'1.0-0':'fr-FR' }}</span>
                    <span *ngSwitchCase="'percent'">{{ stat.value | percent:'1.0-1':'fr-FR' }}</span>
                    <span *ngSwitchDefault>{{ stat.value | number:'1.0-0':'fr-FR' }}</span>
                  </ng-container>
                </span>
              </div>
              <p class="stat-title">{{ stat.title }}</p>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="actions-section">
          <h2>Actions rapides</h2>
          <div class="actions-grid">
            <ng-container *ngIf="vm.user.role === UserRole.PATIENT">
              <mat-card class="action-card" routerLink="/doctors/search">
                <mat-icon color="primary">search</mat-icon>
                <h3>Recherche avancée</h3>
                <p>Filtrez les médecins par spécialité, tarifs et disponibilités</p>
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

            <ng-container *ngIf="vm.user.role === UserRole.DOCTOR">
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

            <ng-container *ngIf="vm.user.role === UserRole.ADMIN">
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
        <div class="insights-section" *ngIf="vm.user.role === UserRole.DOCTOR && vm.doctorInsights as doctor">
          <h2>📊 Statistiques de vos consultations</h2>
          <div class="insights-grid">
            <mat-card class="insight-card">
              <h3>RDV sur 7 jours</h3>
              <div class="bar-chart">
                <div class="bar" *ngFor="let point of doctor.weeklyCounts; trackBy: trackByLabel">
                  <div class="bar-column">
                    <div class="bar-fill" [style.height.%]="doctor.maxWeeklyCount ? (point.value / doctor.maxWeeklyCount) * 100 : 0"></div>
                  </div>
                  <span class="bar-label">{{ point.label }}</span>
                  <span class="bar-value">{{ point.value }}</span>
                </div>
              </div>
            </mat-card>

            <mat-card class="insight-card">
              <h3>Taux de présence</h3>
              <p class="insight-highlight">{{ doctor.presenceRate | percent:'1.0-1':'fr-FR' }}</p>
              <div class="progress-list">
                <div class="progress-item" *ngFor="let status of doctor.statusDistribution; trackBy: trackByLabel">
                  <div class="progress-header">
                    <span>{{ status.label }}</span>
                    <span>{{ status.value | number:'1.0-0':'fr-FR' }} ({{ status.percent | number:'1.0-0':'fr-FR' }}%)</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="status.percent"></div>
                  </div>
                </div>
              </div>
            </mat-card>

            <mat-card class="insight-card">
              <h3>Patients les plus fréquents</h3>
              <ul class="list-unstyled" *ngIf="doctor.topPatients.length; else noPatients">
                <li *ngFor="let patient of doctor.topPatients; trackBy: trackByLabel">
                  <span class="list-name">{{ patient.label }}</span>
                  <span class="list-value">{{ patient.value | number:'1.0-0':'fr-FR' }} RDV</span>
                </li>
              </ul>
              <ng-template #noPatients>
                <p class="empty-state">Pas encore de patients récurrents.</p>
              </ng-template>
              <div class="insight-footer">Revenus estimés : <strong>{{ doctor.revenueEstimate | currency:'EUR':'symbol':'1.0-0':'fr-FR' }}</strong></div>
            </mat-card>
          </div>
        </div>

        <div class="insights-section" *ngIf="vm.user.role === UserRole.PATIENT && vm.patientInsights as patient">
          <h2>🩺 Suivi de votre santé</h2>
          <div class="insights-grid">
            <mat-card class="insight-card">
              <h3>Historique sur 6 mois</h3>
              <div class="bar-chart">
                <div class="bar" *ngFor="let point of patient.historyTimeline; trackBy: trackByLabel">
                  <div class="bar-column">
                    <div class="bar-fill" [style.height.%]="patient.maxHistoryCount ? (point.value / patient.maxHistoryCount) * 100 : 0"></div>
                  </div>
                  <span class="bar-label">{{ point.label }}</span>
                  <span class="bar-value">{{ point.value }}</span>
                </div>
              </div>
            </mat-card>

            <mat-card class="insight-card">
              <h3>Taux d'assiduité</h3>
              <p class="insight-highlight">{{ patient.completionRate | percent:'1.0-1':'fr-FR' }}</p>
              <p class="insight-subtext">Pourcentage de rendez-vous complétés avec succès.</p>
            </mat-card>

            <mat-card class="insight-card">
              <h3>Médecins consultés</h3>
              <ul class="list-unstyled" *ngIf="patient.favouriteDoctors.length; else noDoctors">
                <li *ngFor="let doctor of patient.favouriteDoctors; trackBy: trackByLabel">
                  <span class="list-name">{{ doctor.label }}</span>
                  <span class="list-value">{{ doctor.value | number:'1.0-0':'fr-FR' }} RDV</span>
                </li>
              </ul>
              <ng-template #noDoctors>
                <p class="empty-state">Commencez par prendre rendez-vous pour remplir votre historique.</p>
              </ng-template>
            </mat-card>
          </div>
        </div>
        <div class="insights-section" *ngIf="vm.user.role === UserRole.ADMIN && vm.adminInsights as admin">
          <h2>📈 Santé de la plateforme</h2>
          <div class="insights-grid">
            <mat-card class="insight-card">
              <h3>RDV sur 6 mois</h3>
              <div class="bar-chart">
                <div class="bar" *ngFor="let point of admin.appointmentTrend; trackBy: trackByLabel">
                  <div class="bar-column">
                    <div class="bar-fill" [style.height.%]="admin.maxAppointmentTrend ? (point.value / admin.maxAppointmentTrend) * 100 : 0"></div>
                  </div>
                  <span class="bar-label">{{ point.label }}</span>
                  <span class="bar-value">{{ point.value }}</span>
                </div>
              </div>
            </mat-card>

            <mat-card class="insight-card">
              <h3>Répartition utilisateurs</h3>
              <ul class="list-unstyled">
                <li *ngFor="let role of admin.userBreakdown; trackBy: trackByLabel">
                  <span class="list-name">{{ role.label }}</span>
                  <span class="list-value">{{ role.value | number:'1.0-0':'fr-FR' }}</span>
                </li>
              </ul>
            </mat-card>

            <mat-card class="insight-card">
              <h3>Spécialités les plus demandées</h3>
              <div class="progress-list">
                <div class="progress-item" *ngFor="let specialty of admin.specialtyBreakdown; trackBy: trackByLabel">
                  <div class="progress-header">
                    <span>{{ specialty.label }}</span>
                    <span>{{ specialty.value | number:'1.0-0':'fr-FR' }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="specialty.value"></div>
                  </div>
                </div>
              </div>
            </mat-card>
          </div>
        </div>

        <div class="upcoming-section" *ngIf="vm.upcoming.length > 0">
          <h2>📅 Prochains rendez-vous</h2>
          <div class="appointments-list">
            <mat-card *ngFor="let appointment of vm.upcoming; trackBy: trackByAppointment" class="appointment-card">
              <div class="appointment-date">
                <div class="day">{{ getDay(appointment.appointmentDate) }}</div>
                <div class="month">{{ getMonth(appointment.appointmentDate) }}</div>
              </div>
              <div class="appointment-details">
                <h3>{{ getAppointmentTitle(appointment, vm.user.role) }}</h3>
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

        <div class="empty-upcoming" *ngIf="vm.upcoming.length === 0">
          <mat-card>
            <mat-card-content>
              <h3>Aucun rendez-vous imminent</h3>
              <p>Planifiez votre prochain rendez-vous pour le voir apparaître ici.</p>
              <button mat-raised-button color="primary" *ngIf="vm.user.role !== UserRole.ADMIN" routerLink="/appointments/create">
                Planifier un rendez-vous
              </button>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
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
      font-size: 30px;
      font-weight: bold;
      color: #333;
    }

    .stat-title {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .actions-section, .upcoming-section, .insights-section {
      margin-bottom: 32px;
    }

    .actions-section h2, .upcoming-section h2, .insights-section h2 {
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

    .actions-grid h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 18px;
    }

    .actions-grid p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }


    @media (max-width: 768px) {
      .toolbar {
        flex-wrap: wrap;
        gap: 12px;
      }

      .dashboard-content {
        padding: 16px;
      }

      .stat-value {
        font-size: 24px;
      }

      .actions-grid, .insights-grid {
        grid-template-columns: 1fr;
      }

      .appointment-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .appointment-date {
        display: flex;
        align-items: baseline;
        gap: 12px;
      }
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

})
export class DashboardComponent {
  private readonly destroyRef = inject(DestroyRef);

  currentUser: User | null = this.authService.getCurrentUser();
  UserRole = UserRole;
  statusBreakdown: { status: AppointmentStatus; label: string; count: number }[] = [];
  adminHighlights: { label: string; value: string; description?: string }[] = [];
  adminTrends: { period: string; total: number; delta: number; confirmed: number }[] = [];


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
    if (!this.currentUser) {
      return;
    }

    if (this.currentUser.role === UserRole.ADMIN) {
      this.loadAdminDashboard();
      return;
    }

    this.appointmentService.getMyAppointments().subscribe({
      next: (response: any) => {
        const appointments = response.appointments || [];
        this.upcomingAppointments = this.extractUpcomingAppointments(appointments);
        this.statusBreakdown = [];
        this.adminHighlights = [];
        this.adminTrends = [];

        this.buildStats(appointments);
      },
      error: (error: any) => {
        console.error('Erreur chargement des données du tableau de bord:', error);
      }
    });
  }

  private loadAdminDashboard(): void {
    this.statusBreakdown = [];
    this.adminHighlights = [];
    this.adminTrends = [];

    forkJoin({
      appointments: this.appointmentService.getAllAppointments(),
      users: this.userService.getAllUsers(),
      doctors: this.doctorService.getAllDoctors()
    }).subscribe({
      next: ({ appointments, users, doctors }) => {
        const appointmentList = appointments.appointments || [];
        const appointmentCount = appointments.count ?? appointmentList.length;
        const userCount = users?.count ?? users?.users?.length ?? 0;
        const doctorCount = doctors?.count ?? doctors?.doctors?.length ?? 0;

        this.upcomingAppointments = this.extractUpcomingAppointments(appointmentList);
        this.stats = [
          {
            title: 'Total rendez-vous',
            value: appointmentCount,
            icon: 'event',
            color: '#4caf50',
            route: '/appointments'
          },
          {
            title: 'Utilisateurs',
            value: userCount,
            icon: 'people',
            color: '#2196f3',
            route: '/users'
          },
          {
            title: 'Médecins actifs',
            value: doctorCount,
            icon: 'local_hospital',
            color: '#ff9800',
            route: '/doctors'
          }
        ];

        this.buildAdminInsights(appointmentList);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des indicateurs administrateur:', error);
      }
    ];
  }

  private buildAdminTrends(appointments: Appointment[]): { period: string; total: number; delta: number; confirmed: number }[] {
    const trends: { period: string; total: number; delta: number; confirmed: number }[] = [];
    const reference = new Date();

    for (let weekOffset = 0; weekOffset < 5; weekOffset++) {
      const start = this.startOfWeek(reference, weekOffset);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const weeklyAppointments = appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointmentDate >= start && appointmentDate <= end;
      });

      const period = `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} → ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
      const confirmed = weeklyAppointments.filter((appointment) => appointment.status === AppointmentStatus.CONFIRMED).length;

      trends.push({ period, total: weeklyAppointments.length, confirmed, delta: 0 });
    }

    return trends.map((trend, index) => {
      const previous = trends[index + 1];
      const delta = previous ? trend.total - previous.total : 0;
      return { ...trend, delta };
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
      return;
    }
  }

  private buildAdminInsights(appointments: Appointment[]): void {
    this.statusBreakdown = this.buildStatusBreakdown(appointments);
    this.adminHighlights = this.buildAdminHighlights(appointments);
    this.adminTrends = this.buildAdminTrends(appointments);
  }

  private buildStatusBreakdown(appointments: Appointment[]): { status: AppointmentStatus; label: string; count: number }[] {
    const statuses = [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.PENDING,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.NO_SHOW
    ];

    return statuses
      .map((status) => ({
        status,
        label: this.getStatusLabel(status),
        count: appointments.filter((appointment) => appointment.status === status).length
      }))
      .filter((item) => item.count > 0);
  }

  private buildAdminHighlights(appointments: Appointment[]): { label: string; value: string; description?: string }[] {
    const total = appointments.length;
    const safeTotal = total === 0 ? 1 : total;
    const confirmed = appointments.filter((appointment) => appointment.status === AppointmentStatus.CONFIRMED).length;
    const cancelled = appointments.filter((appointment) => appointment.status === AppointmentStatus.CANCELLED).length;
    const noShow = appointments.filter((appointment) => appointment.status === AppointmentStatus.NO_SHOW).length;
    const pending = appointments.filter((appointment) => appointment.status === AppointmentStatus.PENDING).length;
    const upcoming30 = this.countUpcomingWithin(appointments, 30);

    const confirmationRate = Math.round((confirmed / safeTotal) * 100);
    const cancellationRate = Math.round(((cancelled + noShow) / safeTotal) * 100);

    return [
      {
        label: 'Taux de confirmation',
        value: `${confirmationRate}%`,
        description: `${confirmed} confirmés sur ${total}`
      },
      {
        label: 'Annulations & absences',
        value: `${cancellationRate}%`,
        description: `${cancelled + noShow} événements à surveiller`
      },
      {
        label: 'Rendez-vous à venir (30j)',
        value: `${upcoming30}`,
        description: `${pending} en attente de validation`
      }
    ];
  }

  private buildAdminTrends(appointments: Appointment[]): { period: string; total: number; delta: number; confirmed: number }[] {
    const trends: { period: string; total: number; delta: number; confirmed: number }[] = [];
    const reference = new Date();

    for (let weekOffset = 0; weekOffset < 5; weekOffset++) {
      const start = this.startOfWeek(reference, weekOffset);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const weeklyAppointments = appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointmentDate >= start && appointmentDate <= end;
      });

      const period = `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} → ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
      const confirmed = weeklyAppointments.filter((appointment) => appointment.status === AppointmentStatus.CONFIRMED).length;

      trends.push({ period, total: weeklyAppointments.length, confirmed, delta: 0 });
    }

    return trends.map((trend, index) => {
      const previous = trends[index + 1];
      const delta = previous ? trend.total - previous.total : 0;
      return { ...trend, delta };
    });
  }


  private countUpcomingWithin(appointments: Appointment[], daysAhead: number): number {
    const now = new Date();
    const limit = new Date();
    limit.setHours(23, 59, 59, 999);
    limit.setDate(limit.getDate() + daysAhead);

    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate >= now && appointmentDate <= limit && appointment.status !== AppointmentStatus.CANCELLED;
    }).length;
  }

  private startOfWeek(reference: Date, weeksAgo: number): Date {
    const date = new Date(reference);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = (day + 6) % 7; // Lundi comme début de semaine
    date.setDate(date.getDate() - diff - weeksAgo * 7);
    return date;

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

  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  readonly UserRole = UserRole;

  readonly viewModel$ = this.authService.currentUser$.pipe(
    switchMap(user => {
      if (!user) {
        return of<DashboardViewModel | null>(null);
      }

      return this.buildViewModel(user).pipe(
        map(data => ({ ...data, user })),
        catchError(error => {
          console.error('Erreur chargement dashboard:', error);
          return of({ user, stats: [], upcoming: [] });
        })
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly monthNames = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
  private readonly specialtyLabels: Record<string, string> = {
    [MedicalSpecialty.GENERAL_PRACTICE]: 'Médecine générale',
    [MedicalSpecialty.CARDIOLOGY]: 'Cardiologie',
    [MedicalSpecialty.DERMATOLOGY]: 'Dermatologie',
    [MedicalSpecialty.PEDIATRICS]: 'Pédiatrie',
    [MedicalSpecialty.GYNECOLOGY]: 'Gynécologie',
    [MedicalSpecialty.ORTHOPEDICS]: 'Orthopédie',
    [MedicalSpecialty.PSYCHIATRY]: 'Psychiatrie',
    [MedicalSpecialty.OPHTHALMOLOGY]: 'Ophtalmologie',
    [MedicalSpecialty.ENT]: 'ORL',
    [MedicalSpecialty.NEUROLOGY]: 'Neurologie',
    [MedicalSpecialty.OTHER]: 'Autres'
  };

  constructor(
    private readonly authService: AuthService,
    private readonly appointmentService: AppointmentService,
    private readonly doctorService: DoctorService,
    private readonly userService: UserService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  trackByStat = (_: number, stat: StatCard) => stat.title;
  trackByLabel = (_: number, item: ChartPoint) => item.label;
  trackByAppointment = (_: number, appointment: Appointment) => appointment.id;

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrateur';
      case UserRole.DOCTOR:
        return 'Médecin';
      case UserRole.PATIENT:
        return 'Patient';
      default:
        return 'Utilisateur';

    }
  }

  getWelcomeMessage(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Gérez votre plateforme médicale';
      case UserRole.DOCTOR:
        return 'Gérez vos consultations et patients';
      case UserRole.PATIENT:
        return 'Prenez soin de votre santé';
      default:
        return 'Bienvenue sur MedAppointment';
    }
  }

  getAppointmentTitle(appointment: Appointment, role: UserRole): string {
    if (role === UserRole.PATIENT) {
      return `Dr. ${appointment.doctor?.firstName ?? ''} ${appointment.doctor?.lastName ?? ''}`.trim();
    }

    if (role === UserRole.DOCTOR) {
      return `${appointment.patient?.firstName ?? ''} ${appointment.patient?.lastName ?? ''}`.trim();
    }

    return `${appointment.patient?.firstName ?? ''} ${appointment.patient?.lastName ?? ''}`.trim() || appointment.reason;
  }

  getDay(dateString: string): string {
    return new Date(dateString).getDate().toString();
  }

  getMonth(dateString: string): string {
    return this.monthNames[new Date(dateString).getMonth()] ?? '';
  }

  getTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusLabel(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'En attente';
      case AppointmentStatus.CONFIRMED:
        return 'Confirmé';
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

  private buildViewModel(user: User): Observable<Omit<DashboardViewModel, 'user'>> {
    if (user.role === UserRole.ADMIN) {
      return forkJoin({
        appointmentsRes: this.appointmentService.getAllAppointments().pipe(catchError(() => of({ appointments: [], count: 0 }))),
        usersRes: this.userService.getAllUsers().pipe(catchError(() => of({ users: [], count: 0 }))),
        doctorsRes: this.doctorService.getAllDoctors().pipe(catchError(() => of({ doctors: [], count: 0 })))
      }).pipe(
        map(({ appointmentsRes, usersRes, doctorsRes }) => {
          const appointments = appointmentsRes.appointments ?? [];
          const users = usersRes.users ?? [];
          const doctorProfiles = doctorsRes.doctors ?? [];

          const confirmedOrCompleted = appointments.filter(a => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.COMPLETED);
          const utilizationRate = appointments.length ? confirmedOrCompleted.length / appointments.length : 0;

          const adminCount = users.filter(userItem => userItem.role === UserRole.ADMIN).length;
          const doctorCount = users.filter(userItem => userItem.role === UserRole.DOCTOR).length;
          const patientCount = users.filter(userItem => userItem.role === UserRole.PATIENT).length;
          const activeUsers = users.filter(userItem => userItem.isActive).length;

          const appointmentTrend = this.buildMonthlyTrend(appointments, 6);
          const specialtyBreakdown = this.buildSpecialtyBreakdown(doctorProfiles);

          const stats: StatCard[] = [
            {
              title: 'Total rendez-vous',
              value: appointments.length,
              icon: 'event',
              color: '#4caf50',
              route: '/appointments'
            },
            {
              title: "Taux d'occupation",
              value: utilizationRate,
              icon: 'trending_up',
              color: '#ff9800',
              format: 'percent'
            },
            {
              title: 'Utilisateurs actifs',
              value: activeUsers,
              icon: 'people',
              color: '#2196f3',
              route: '/users'
            },
            {
              title: 'Médecins enregistrés',
              value: doctorProfiles.length,
              icon: 'local_hospital',
              color: '#9c27b0',
              route: '/doctors'
            }
          ];

          const adminInsights: AdminInsights = {
            appointmentTrend: appointmentTrend.points,
            maxAppointmentTrend: appointmentTrend.max,
            specialtyBreakdown,
            userBreakdown: [
              { label: 'Administrateurs', value: adminCount },
              { label: 'Médecins', value: doctorCount },
              { label: 'Patients', value: patientCount }
            ]
          };

          return {
            stats,
            upcoming: this.buildUpcomingAppointments(appointments),
            adminInsights
          };
        })
      );
    }

    if (user.role === UserRole.DOCTOR) {
      return forkJoin({
        appointmentsRes: this.appointmentService.getMyAppointments().pipe(catchError(() => of({ appointments: [], count: 0 }))),
        profileRes: this.doctorService.getMyDoctorProfile().pipe(catchError(() => of(null)))
      }).pipe(
        map(({ appointmentsRes, profileRes }) => {
          const appointments = appointmentsRes.appointments ?? [];
          const profile = (profileRes as { profile: DoctorProfile } | null)?.profile ?? user.doctorProfile ?? null;

          const now = new Date();
          const weekWindow = this.getWeekWindow(now);
          const appointmentsThisWeek = appointments.filter(appointment => this.isBetween(new Date(appointment.appointmentDate), weekWindow.start, weekWindow.end));
          const productiveAppointments = appointmentsThisWeek.filter(appointment => appointment.status === AppointmentStatus.CONFIRMED || appointment.status === AppointmentStatus.COMPLETED);

          const completedAppointments = appointments.filter(appointment => appointment.status === AppointmentStatus.COMPLETED);
          const noShowAppointments = appointments.filter(appointment => appointment.status === AppointmentStatus.NO_SHOW);
          const presenceDenominator = completedAppointments.length + noShowAppointments.length;
          const presenceRate = presenceDenominator ? completedAppointments.length / presenceDenominator : 1;

          const consultationFee = profile?.consultationFee ?? 0;
          const revenueEstimate = consultationFee * completedAppointments.length;

          const uniquePatientsThisMonth = this.countUniquePatientsWithinMonth(appointments, now);

          const stats: StatCard[] = [
            {
              title: 'Consultations cette semaine',
              value: productiveAppointments.length,
              icon: 'event_available',
              color: '#4caf50',
              route: '/appointments'
            },
            {
              title: "Taux de présence",
              value: presenceRate,
              icon: 'task_alt',
              color: '#2196f3',
              format: 'percent'
            },
            {
              title: 'Revenus estimés',
              value: revenueEstimate,
              icon: 'euro',
              color: '#ff9800',
              format: 'currency'
            },
            {
              title: 'Nouveaux patients (mois)',
              value: uniquePatientsThisMonth,
              icon: 'person_add',
              color: '#9c27b0'
            }
          ];

          const weeklyCounts = this.buildDailyTrend(appointments, 7);
          const statusDistribution = this.buildStatusDistribution(appointments);
          const topPatients = this.buildTopPatients(appointments);

          const doctorInsights: DoctorInsights = {
            weeklyCounts: weeklyCounts.points,
            maxWeeklyCount: weeklyCounts.max,
            statusDistribution,
            topPatients,
            revenueEstimate,
            presenceRate
          };

          return {
            stats,
            upcoming: this.buildUpcomingAppointments(appointments),
            doctorInsights
          };
        })
      );
    }

    return this.appointmentService.getMyAppointments().pipe(
      catchError(() => of({ appointments: [], count: 0 })),
      map(response => {
        const appointments = response.appointments ?? [];
        const upcoming = this.buildUpcomingAppointments(appointments);

        const confirmedAppointments = appointments.filter(appointment => appointment.status === AppointmentStatus.CONFIRMED);
        const completedAppointments = appointments.filter(appointment => appointment.status === AppointmentStatus.COMPLETED);

        const uniqueDoctorCount = new Set(appointments.map(appointment => appointment.doctorId)).size;

        const stats: StatCard[] = [
          {
            title: 'Rendez-vous planifiés',
            value: upcoming.length,
            icon: 'calendar_month',
            color: '#4caf50',
            route: '/appointments'
          },
          {
            title: 'Rendez-vous confirmés',
            value: confirmedAppointments.length,
            icon: 'check_circle',
            color: '#2196f3'
          },
          {
            title: 'Consultations terminées',
            value: completedAppointments.length,
            icon: 'task_alt',
            color: '#9c27b0'
          },
          {
            title: 'Médecins consultés',
            value: uniqueDoctorCount,
            icon: 'diversity_3',
            color: '#ff9800',
            route: '/doctors/search'
          }
        ];

        const historyTimeline = this.buildMonthlyTrend(appointments, 6);
        const favouriteDoctors = this.buildFavouriteDoctors(appointments);
        const completionRate = appointments.length ? completedAppointments.length / appointments.length : 0;

        const patientInsights: PatientInsights = {
          historyTimeline: historyTimeline.points,
          maxHistoryCount: historyTimeline.max,
          favouriteDoctors,
          completionRate
        };

        return {
          stats,
          upcoming,
          patientInsights
        };
      })
    );
  }

  private buildUpcomingAppointments(appointments: Appointment[]): Appointment[] {
    const now = new Date();
    return appointments
      .filter(appointment => new Date(appointment.appointmentDate) > now)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
      .slice(0, 3);
  }

  private buildDailyTrend(appointments: Appointment[], days: number) {
    const points: ChartPoint[] = [];
    const today = new Date();

    for (let index = days - 1; index >= 0; index--) {
      const date = new Date(today);
      date.setDate(today.getDate() - index);

      const label = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      const value = appointments.filter(appointment => this.isSameDay(new Date(appointment.appointmentDate), date)).length;
      points.push({ label, value });
    }

    const max = points.reduce((acc, point) => Math.max(acc, point.value), 0);
    return { points, max };
  }

  private buildMonthlyTrend(appointments: Appointment[], months: number) {
    const points: ChartPoint[] = [];
    const now = new Date();

    for (let index = months - 1; index >= 0; index--) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const label = date.toLocaleDateString('fr-FR', { month: 'short' });

    const value = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.getMonth() === date.getMonth() && appointmentDate.getFullYear() === date.getFullYear();
    }).length;

    points.push({ label, value });
  }

    const max = points.reduce((acc, point) => Math.max(acc, point.value), 0);
    return { points, max };
  }

  private buildStatusDistribution(appointments: Appointment[]): ChartPoint[] {
    const total = appointments.length || 1;
    const statuses: { status: AppointmentStatus; label: string }[] = [
      { status: AppointmentStatus.CONFIRMED, label: 'Confirmés' },
      { status: AppointmentStatus.COMPLETED, label: 'Terminés' },
      { status: AppointmentStatus.PENDING, label: 'En attente' },
      { status: AppointmentStatus.CANCELLED, label: 'Annulés' },
      { status: AppointmentStatus.NO_SHOW, label: 'Absences' }
    ];

    return statuses.map(item => {
      const value = appointments.filter(appointment => appointment.status === item.status).length;
      return {
        label: item.label,
        value,
        percent: total ? (value / total) * 100 : 0
      };
    });
  }

  private buildTopPatients(appointments: Appointment[]): ChartPoint[] {
    const counts = new Map<string, number>();

    appointments.forEach(appointment => {
      if (!appointment.patientId) {
        return;
      }

      const name = `${appointment.patient?.firstName ?? ''} ${appointment.patient?.lastName ?? ''}`.trim() || 'Patient inconnu';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
  }

  private countUniquePatientsWithinMonth(appointments: Appointment[], reference: Date): number {
    const month = reference.getMonth();
    const year = reference.getFullYear();
    const set = new Set<string>();

    appointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      if (appointmentDate.getMonth() === month && appointmentDate.getFullYear() === year && appointment.patientId) {
        set.add(appointment.patientId);
      }
    });

    return set.size;
  }

  private buildFavouriteDoctors(appointments: Appointment[]): ChartPoint[] {
    const counts = new Map<string, number>();

    appointments.forEach(appointment => {
      if (!appointment.doctorId) {
        return;
      }

      const name = `Dr. ${appointment.doctor?.firstName ?? ''} ${appointment.doctor?.lastName ?? ''}`.trim() || 'Médecin inconnu';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
  }

  private buildSpecialtyBreakdown(doctors: DoctorProfile[]): ChartPoint[] {
    if (!doctors.length) {
      return [];
    }

    const counts = new Map<string, number>();

    doctors.forEach(profile => {
      const specialty = profile.specialty ?? MedicalSpecialty.OTHER;
      const label = this.specialtyLabels[specialty] ?? 'Autres';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    const total = doctors.length;

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value: (value / total) * 100 }));
  }

  private getWeekWindow(date: Date) {
    const start = new Date(date);
    const end = new Date(date);

    const day = date.getDay();
    const diffToMonday = (day + 6) % 7;

    start.setDate(date.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);

    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  }

  private isBetween(date: Date, start: Date, end: Date): boolean {
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }
}
