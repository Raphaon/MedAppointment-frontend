import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NotificationCenterComponent } from '@app/shared/components/notification-center.component';
import { DashboardCardComponent, DashboardCardModel } from './components/dashboard-card/dashboard-card.component';
import { StatsChartComponent } from './components/stats-chart/stats-chart.component';
import { RecentAppointmentsComponent, RecentAppointmentItem } from './components/recent-appointments/recent-appointments.component';
import { RevenueOverviewComponent, RevenueOverviewModel } from './components/revenue-overview/revenue-overview.component';
import { AppointmentService } from '@app/core/services/appointment.service';
import { AuthService } from '@app/core/services/auth.service';
import { DoctorService } from '@app/core/services/doctor.service';
import { UserService } from '@app/core/services/user.service';
import { Appointment, AppointmentStatus, MedicalSpecialty, User, UserRole } from '@app/core/models';
import { DashboardState, StatCard } from './dashboard.state';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';
import { forkJoin } from 'rxjs';

interface NavigationItem {
  label: string;
  route: string;
  icon: string;
}

interface QuickAction {
  route: string;
  label: string;
  description: string;
  emoji: string;
  accent: string;
}

interface StatusBreakdown {
  status: AppointmentStatus;
  label: string;
  count: number;
}

interface TrendItem {
  period: string;
  total: number;
  delta: number;
  confirmed: number;
}

interface StatsChartConfig {
  type: 'line' | 'pie';
  title: string;
  subtitle?: string;
  description?: string;
  labels: string[];
  series: number[];
  primaryValue?: string;
  primaryLabel?: string;
}

interface DoctorPerformance {
  doctorId: string;
  name: string;
  specialty: string;
  consultations: number;
  presenceRate: number;
  revenue: number;
}

interface AnalyticsSnapshot {
  statusCounts: Map<AppointmentStatus, number>;
  todayTotal: number;
  yesterdayTotal: number;
  thisWeekTotal: number;
  lastWeekTotal: number;
  pendingThisWeek: number;
  pendingLastWeek: number;
  completedThisMonth: number;
  completedLastMonth: number;
  upcomingSeven: number;
  upcomingThirty: number;
  revenueThisWeek: number;
  revenueLastWeek: number;
  weeklyTimeline: { label: string; total: number; revenue: number }[];
  specialtyRevenue: Map<MedicalSpecialty | string, number>;
  doctorMetrics: Map<string, DoctorAccumulator>;
}

interface DoctorAccumulator {
  name: string;
  specialty?: MedicalSpecialty | string;
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    NotificationCenterComponent,
    DashboardCardComponent,
    StatsChartComponent,
    RecentAppointmentsComponent,
    RevenueOverviewComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly navigationItems: NavigationItem[] = [
    { label: 'Accueil', route: '/dashboard', icon: 'home' },
    { label: 'Consultations', route: '/appointments', icon: 'event' },
    { label: 'Dossiers médicaux', route: '/medical-records', icon: 'folder_shared' },
    { label: 'Statistiques', route: '/analytics', icon: 'monitoring' },
    { label: 'Profil', route: '/profile', icon: 'person' }
  ];

  currentUser: User | null = null;
  stats: StatCard[] = [];
  summaryCards: DashboardCardModel[] = [];
  upcomingAppointments: Appointment[] = [];
  appointmentView: RecentAppointmentItem[] = [];
  consultationTrendChart?: StatsChartConfig;
  statusChart?: StatsChartConfig;
  revenueOverview?: RevenueOverviewModel;
  adminDoctorPerformance: DoctorPerformance[] = [];

  statusBreakdown: StatusBreakdown[] = [];
  adminTrends: TrendItem[] = [];

  readonly UserRole = UserRole;
  readonly AppointmentStatus = AppointmentStatus;

  private userAppointments: Appointment[] = [];
  private adminAppointments: Appointment[] = [];
  private analytics: AnalyticsSnapshot = this.createEmptyAnalytics();
  private adminStatsLoaded = false;

  constructor(
    private readonly authService: AuthService,
    private readonly appointmentService: AppointmentService,
    private readonly userService: UserService,
    private readonly doctorService: DoctorService,
    private readonly dashboardState: DashboardState
  ) {
    this.dashboardState.stats$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        this.stats = stats;
        this.updateSummaryCards();
        if (this.currentUser?.role === UserRole.ADMIN) {
          this.loadAdminMetrics();
        }
      });

    this.dashboardState.upcomingAppointments$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((appointments) => {
        this.upcomingAppointments = appointments;
        this.appointmentView = this.buildAppointmentView(appointments);
      });

    this.dashboardState.appointmentsForCurrentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((appointments) => {
        this.userAppointments = appointments;
        if (this.currentUser?.role !== UserRole.ADMIN) {
          this.recomputeAnalytics();
        }
      });

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
        if (user?.role === UserRole.ADMIN) {
          this.loadAdminMetrics();
          this.loadAdminInsights();
        } else {
          this.adminAppointments = [];
          this.adminDoctorPerformance = [];
          this.recomputeAnalytics();
        }
      });
  }

  logout(): void {
    this.authService.logout();
  }

  get primaryActions(): QuickAction[] {
    return this.quickActions;
  }

  get quickActions(): QuickAction[] {
    const role = this.currentUser?.role;

    if (role === UserRole.PATIENT) {
      return [
        {
          route: '/doctors',
          label: 'Trouver un médecin',
          description: 'Explorez les spécialistes disponibles autour de vous',
          emoji: '🔍',
          accent: 'linear-gradient(135deg, #dbeafe, #bfdbfe)'
        },
        {
          route: '/appointments/create',
          label: 'Planifier un rendez-vous',
          description: 'Choisissez la date idéale en quelques secondes',
          emoji: '🗓️',
          accent: 'linear-gradient(135deg, #ede9fe, #ddd6fe)'
        },
        {
          route: '/appointments',
          label: 'Suivre mes visites',
          description: 'Visualisez vos rendez-vous à venir et passés',
          emoji: '🧾',
          accent: 'linear-gradient(135deg, #fef3c7, #fde68a)'
        },
        {
          route: '/profile',
          label: 'Mon espace santé',
          description: 'Mettez à jour vos informations personnelles en toute simplicité',
          emoji: '💠',
          accent: 'linear-gradient(135deg, #cffafe, #a5f3fc)'
        }
      ];
    }

    if (role === UserRole.NURSE) {
      return [
        {
          route: '/appointments',
          label: 'Rendez-vous assignés',
          description: 'Consultez les visites du jour et préparez vos interventions',
          emoji: '🗓️',
          accent: 'linear-gradient(135deg, #ecfccb, #d9f99d)'
        },
        {
          route: '/appointments',
          label: 'Saisir des paramètres vitaux',
          description: 'Accédez rapidement aux dossiers patients pour renseigner leurs constantes',
          emoji: '💉',
          accent: 'linear-gradient(135deg, #e0f2fe, #bae6fd)'
        },
        {
          route: '/hospitals',
          label: 'Services & équipes',
          description: 'Consultez les services auxquels vous êtes affecté',
          emoji: '🏥',
          accent: 'linear-gradient(135deg, #ede9fe, #ddd6fe)'
        }
      ];
    }

    if (role === UserRole.DOCTOR) {
      return [
        {
          route: '/calendar',
          label: 'Calendrier intelligent',
          description: 'Une vue claire de votre journée de consultations',
          emoji: '📆',
          accent: 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
        },
        {
          route: '/appointments',
          label: 'Suivi des rendez-vous',
          description: 'Confirmez, adaptez et optimisez vos créneaux',
          emoji: '🩺',
          accent: 'linear-gradient(135deg, #fae8ff, #f5d0fe)'
        },
        {
          route: '/profile',
          label: 'Profil professionnel',
          description: 'Affinez vos informations et votre disponibilité',
          emoji: '🎯',
          accent: 'linear-gradient(135deg, #fee2e2, #fecaca)'
        }
      ];
    }

    if (role === UserRole.ADMIN) {
      return [
        {
          route: '/users',
          label: 'Gestion des comptes',
          description: 'Pilotez vos équipes et leurs accès en toute fluidité',
          emoji: '🧑‍🤝‍🧑',
          accent: 'linear-gradient(135deg, #e0f2fe, #bae6fd)'
        },
        {
          route: '/appointments',
          label: 'Surveillance des RDV',
          description: 'Vérifiez l’équilibre de vos confirmations et absences',
          emoji: '🛰️',
          accent: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
        },
        {
          route: '/hospitals',
          label: 'Gestion des hôpitaux',
          description: 'Structurez les établissements, services et équipes soignantes',
          emoji: '🏥',
          accent: 'linear-gradient(135deg, #fef3c7, #fde68a)'
        },
        {
          route: '/doctors',
          label: 'Communauté médicale',
          description: 'Accompagnez les praticiens et suivez leur activité',
          emoji: '🏥',
          accent: 'linear-gradient(135deg, #ede9fe, #ddd6fe)'
        }
      ];
    }

    return [];
  }

  getTimeGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Matin serein';
    }
    if (hour < 18) {
      return 'Après-midi dynamique';
    }
    return 'Soirée détendue';
  }

  getMoodEmoji(): string {
    switch (this.currentUser?.role) {
      case UserRole.ADMIN:
        return '🧭';
      case UserRole.DOCTOR:
        return '🩺';
      case UserRole.NURSE:
        return '💉';
      case UserRole.PATIENT:
        return '🌿';
      default:
        return '✨';
    }
  }

  getWelcomeMessage(): string {
    const role = this.currentUser?.role;
    switch (role) {
      case UserRole.ADMIN:
        return 'Pilotez la performance de votre réseau de soins.';
      case UserRole.DOCTOR:
        return 'Suivez vos consultations et accompagnez vos patients.';
      case UserRole.NURSE:
        return 'Préparez vos visites et centralisez les constantes vitales.';
      case UserRole.PATIENT:
        return 'Organisez vos rendez-vous et suivez votre parcours de soins.';
      default:
        return 'Nous vous souhaitons une excellente journée sur MedAppointment !';
    }
  }

  getUserInitials(): string {
    const first = this.currentUser?.firstName?.charAt(0) ?? '';
    const last = this.currentUser?.lastName?.charAt(0) ?? '';
    const initials = `${first}${last}`.trim();
    return initials ? initials.toUpperCase() : '🙂';
  }

  getRoleLabel(): string {
    switch (this.currentUser?.role) {
      case UserRole.ADMIN:
        return 'Administrateur';
      case UserRole.DOCTOR:
        return 'Médecin';
      case UserRole.NURSE:
        return 'Infirmier(ère)';
      case UserRole.PATIENT:
        return 'Patient';
      default:
        return 'Utilisateur';
    }
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

  getStatusEmoji(status: AppointmentStatus): string {
    const emojis: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: '🕒',
      [AppointmentStatus.CONFIRMED]: '✅',
      [AppointmentStatus.CANCELLED]: '❌',
      [AppointmentStatus.COMPLETED]: '🏁',
      [AppointmentStatus.NO_SHOW]: '⚠️'
    };
    return emojis[status];
  }

  buildConsultationTrendChart(): StatsChartConfig | undefined {
    const series = this.getTrendSeries();
    if (!series.series.length) {
      return undefined;
    }

    return {
      type: 'line',
      title: 'Évolution des consultations',
      subtitle: '6 dernières semaines',
      labels: series.labels,
      series: series.series,
      primaryValue: `${this.formatNumber(series.series.at(-1) ?? 0)} RDV`,
      primaryLabel: 'Cette semaine'
    };
  }

  buildStatusChart(): StatsChartConfig | undefined {
    if (!this.statusBreakdown.length) {
      return undefined;
    }

    const labels = this.statusBreakdown.map((item) => `${item.label}`);
    const series = this.statusBreakdown.map((item) => item.count);

    return {
      type: 'pie',
      title: 'Répartition des statuts',
      subtitle: 'Vue consolidée',
      labels,
      series,
      primaryValue: `${this.formatNumber(series.reduce((acc, value) => acc + value, 0))} RDV`,
      primaryLabel: 'Total suivi'
    };
  }

  private loadAdminMetrics(): void {
    if (this.adminStatsLoaded || this.currentUser?.role !== UserRole.ADMIN || this.stats.length === 0) {
      return;
    }

    this.adminStatsLoaded = true;

    forkJoin({
      users: this.userService.getAllUsers(),
      doctors: this.doctorService.getAllDoctors()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
          this.updateSummaryCards();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des indicateurs administrateur:', error);
          this.adminStatsLoaded = false;
        }
      });
  }

  private loadAdminInsights(): void {
    this.appointmentService
      .getAllAppointments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const appointments = response.appointments ?? [];
          this.adminAppointments = appointments;
          this.statusBreakdown = this.buildStatusBreakdown(appointments);
          this.adminTrends = this.buildTrendItems(appointments);
          this.adminDoctorPerformance = this.buildDoctorPerformance(appointments);
          this.recomputeAnalytics();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des rendez-vous administrateur:', error);
          this.adminAppointments = [];
          this.adminDoctorPerformance = [];
          this.recomputeAnalytics();
        }
      });
  }

  private recomputeAnalytics(): void {
    const appointments = this.currentUser?.role === UserRole.ADMIN ? this.adminAppointments : this.userAppointments;
    this.analytics = this.buildAnalytics(appointments);
    if (this.currentUser?.role !== UserRole.ADMIN) {
      this.statusBreakdown = this.buildStatusBreakdown(appointments);
      this.adminTrends = this.buildTrendItems(appointments);
    }

    this.consultationTrendChart = this.buildConsultationTrendChart();
    this.statusChart = this.buildStatusChart();
    this.revenueOverview = this.buildRevenueOverview();
    this.updateSummaryCards();
  }

  private updateSummaryCards(): void {
    if (!this.currentUser) {
      this.summaryCards = [];
      return;
    }

    if (this.currentUser.role === UserRole.ADMIN) {
      const presenceRate = this.computePresenceRate();
      const presenceDelta = presenceRate - this.computePresenceRate(true);
      const revenueDelta = this.analytics.revenueThisWeek - this.analytics.revenueLastWeek;
      const consultationsDelta = this.analytics.completedThisMonth - this.analytics.completedLastMonth;

      this.summaryCards = [
        {
          title: 'Consultations ce mois',
          value: this.formatNumber(this.analytics.completedThisMonth),
          description: 'Activité réalisée sur les 30 derniers jours',
          trendValue: this.formatDelta(consultationsDelta),
          trendPositive: consultationsDelta >= 0,
          trendLabel: 'vs mois précédent',
          icon: '📅'
        },
        {
          title: 'Taux de présence global',
          value: `${presenceRate.toFixed(1)}%`,
          description: 'Présence moyenne sur les rendez-vous confirmés',
          trendValue: `${presenceDelta >= 0 ? '+' : ''}${presenceDelta.toFixed(1)} pts`,
          trendPositive: presenceDelta >= 0,
          trendLabel: 'vs semaine précédente',
          icon: '🛰️'
        },
        {
          title: 'Revenus hebdomadaires',
          value: this.formatCurrency(this.analytics.revenueThisWeek),
          description: 'Données consolidées toutes spécialités',
          trendValue: this.formatCurrencyDelta(revenueDelta),
          trendPositive: revenueDelta >= 0,
          trendLabel: 'vs semaine précédente',
          icon: '💶'
        },
        {
          title: 'Utilisateurs actifs',
          value: this.formatNumber(this.stats.find((stat) => stat.title === 'Utilisateurs')?.value ?? 0),
          description: 'Collaborateurs connectés sur 30 jours',
          trendValue: 'Live',
          trendLabel: 'Mise à jour en continu',
          icon: '🌐'
        }
      ];
      return;
    }

    this.summaryCards = this.stats.map((stat) => {
      const delta = this.computeDeltaForStat(stat.title, stat.value);
      return {
        title: stat.title,
        value: this.formatNumber(stat.value),
        description: 'Indicateur synchronisé',
        trendValue: delta !== null ? this.formatDelta(delta) : 'Live',
        trendPositive: delta !== null ? delta >= 0 : null,
        trendLabel: delta !== null ? 'vs période précédente' : 'Actualisation continue',
        icon: this.pickIconForStat(stat.title)
      } satisfies DashboardCardModel;
    });
  }

  private buildAppointmentView(appointments: Appointment[]): RecentAppointmentItem[] {
    return appointments.map((appointment) => ({
      id: appointment.id,
      day: this.getDay(appointment.appointmentDate),
      month: this.getMonth(appointment.appointmentDate),
      time: this.getTime(appointment.appointmentDate),
      title: this.getAppointmentTitle(appointment),
      subtitle: this.getAppointmentContext(appointment),
      statusLabel: this.getStatusLabel(appointment.status),
      statusTone: this.mapStatusTone(appointment.status),
      statusEmoji: this.getStatusEmoji(appointment.status)
    }));
  }

  private mapStatusTone(status: AppointmentStatus): RecentAppointmentItem['statusTone'] {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'confirmed';
      case AppointmentStatus.CANCELLED:
        return 'cancelled';
      case AppointmentStatus.COMPLETED:
        return 'completed';
      case AppointmentStatus.NO_SHOW:
        return 'noShow';
      default:
        return 'pending';
    }
  }

  private buildAnalytics(appointments: Appointment[]): AnalyticsSnapshot {
    const now = new Date();
    const startToday = this.startOfDay(now);
    const endToday = this.endOfDay(now);
    const startYesterday = this.addDays(startToday, -1);
    const endYesterday = this.addMilliseconds(startToday, -1);
    const startThisWeek = this.startOfWeek(now);
    const endThisWeek = this.endOfDay(this.addDays(startThisWeek, 6));
    const startLastWeek = this.addDays(startThisWeek, -7);
    const endLastWeek = this.addMilliseconds(startThisWeek, -1);
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const nextSeven = this.addDays(endToday, 7);
    const nextThirty = this.addDays(endToday, 30);

    const statusCounts = new Map<AppointmentStatus, number>();
    const specialtyRevenue = new Map<MedicalSpecialty | string, number>();
    const doctorMetrics = new Map<string, DoctorAccumulator>();
    const weeklyMap = new Map<string, { label: string; total: number; revenue: number }>();

    let todayTotal = 0;
    let yesterdayTotal = 0;
    let thisWeekTotal = 0;
    let lastWeekTotal = 0;
    let pendingThisWeek = 0;
    let pendingLastWeek = 0;
    let completedThisMonth = 0;
    let completedLastMonth = 0;
    let upcomingSeven = 0;
    let upcomingThirty = 0;
    let revenueThisWeek = 0;
    let revenueLastWeek = 0;

    appointments.forEach((appointment) => {
      const date = new Date(appointment.appointmentDate);
      const status = appointment.status;
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
      const revenue = this.getAppointmentRevenue(appointment);

      if (date >= startToday && date <= endToday) {
        todayTotal += 1;
      }

      if (date >= startYesterday && date <= endYesterday) {
        yesterdayTotal += 1;
      }

      if (date >= startThisWeek && date <= endThisWeek) {
        thisWeekTotal += 1;
        revenueThisWeek += revenue;
        if (status === AppointmentStatus.PENDING) {
          pendingThisWeek += 1;
        }
      }

      if (date >= startLastWeek && date <= endLastWeek) {
        lastWeekTotal += 1;
        revenueLastWeek += revenue;
        if (status === AppointmentStatus.PENDING) {
          pendingLastWeek += 1;
        }
      }

      if (status === AppointmentStatus.COMPLETED && date >= startThisMonth && date <= endToday) {
        completedThisMonth += 1;
      }

      if (status === AppointmentStatus.COMPLETED && date >= startLastMonth && date <= endLastMonth) {
        completedLastMonth += 1;
      }

      if (date > now && date <= nextSeven) {
        upcomingSeven += 1;
      }

      if (date > now && date <= nextThirty) {
        upcomingThirty += 1;
      }

      const weekStart = this.startOfWeek(date);
      const weekKey = weekStart.toISOString().slice(0, 10);
      const weekLabel = `${weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`;
      const weekEntry = weeklyMap.get(weekKey) ?? { label: weekLabel, total: 0, revenue: 0 };
      weekEntry.total += 1;
      weekEntry.revenue += revenue;
      weeklyMap.set(weekKey, weekEntry);

      if (appointment.doctor) {
        const doctorId = appointment.doctor.id;
        const acc = doctorMetrics.get(doctorId) ?? {
          name: `${appointment.doctor.firstName ?? ''} ${appointment.doctor.lastName ?? ''}`.trim() || 'Dr. Inconnu',
          specialty: appointment.doctor.doctorProfile?.specialty,
          total: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0
        };
        acc.total += 1;
        if (status === AppointmentStatus.CONFIRMED) {
          acc.confirmed += 1;
        }
        if (status === AppointmentStatus.COMPLETED) {
          acc.completed += 1;
        }
        if (status === AppointmentStatus.CANCELLED || status === AppointmentStatus.NO_SHOW) {
          acc.cancelled += 1;
        }
        acc.revenue += revenue;
        doctorMetrics.set(doctorId, acc);

        const specialty = appointment.doctor.doctorProfile?.specialty ?? 'AUTRE';
        specialtyRevenue.set(specialty, (specialtyRevenue.get(specialty) ?? 0) + revenue);
      }
    });

    const weeklyTimeline = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, value]) => value);

    return {
      statusCounts,
      todayTotal,
      yesterdayTotal,
      thisWeekTotal,
      lastWeekTotal,
      pendingThisWeek,
      pendingLastWeek,
      completedThisMonth,
      completedLastMonth,
      upcomingSeven,
      upcomingThirty,
      revenueThisWeek,
      revenueLastWeek,
      weeklyTimeline,
      specialtyRevenue,
      doctorMetrics
    };
  }

  private buildStatusBreakdown(appointments: Appointment[]): StatusBreakdown[] {
    const statuses: AppointmentStatus[] = [
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

  private buildTrendItems(appointments: Appointment[]): TrendItem[] {
    const reference = new Date();
    const trends: TrendItem[] = [];

    for (let weekOffset = 0; weekOffset < 6; weekOffset++) {
      const start = this.startOfWeek(reference, weekOffset);
      const end = this.endOfDay(this.addDays(start, 6));

      const weeklyAppointments = appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointmentDate >= start && appointmentDate <= end;
      });

      const period = `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} → ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
      const confirmed = weeklyAppointments.filter((appointment) => appointment.status === AppointmentStatus.CONFIRMED).length;
      const total = weeklyAppointments.length;

      trends.push({ period, total, confirmed, delta: 0 });
    }

    return trends.map((trend, index) => {
      const previous = trends[index + 1];
      const delta = previous ? trend.total - previous.total : 0;
      return { ...trend, delta };
    });
  }

  private buildDoctorPerformance(appointments: Appointment[]): DoctorPerformance[] {
    const stats = this.buildAnalytics(appointments).doctorMetrics;

    return Array.from(stats.entries())
      .map(([doctorId, data]) => {
        const presenceRate = data.total === 0 ? 0 : ((data.completed + data.confirmed) / data.total) * 100;
        return {
          doctorId,
          name: data.name,
          specialty: getMedicalSpecialtyLabel(data.specialty as MedicalSpecialty),
          consultations: data.completed,
          presenceRate: Math.round(presenceRate * 10) / 10,
          revenue: data.revenue
        } satisfies DoctorPerformance;
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private buildRevenueOverview(): RevenueOverviewModel | undefined {
    const timeline = this.analytics.weeklyTimeline;
    if (!timeline.length) {
      return undefined;
    }

    const labels = timeline.map((item) => item.label);
    const series = timeline.map((item) => Math.round(item.revenue));
    const breakdownRaw = Array.from(this.analytics.specialtyRevenue.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    const totalBreakdownValue = breakdownRaw.reduce((acc, [, value]) => acc + value, 0);

    const breakdown = breakdownRaw.map(([specialty, value]) => ({
      label: getMedicalSpecialtyLabel(specialty as MedicalSpecialty),
      valueFormatted: this.formatCurrency(value),
      percentage: totalBreakdownValue === 0 ? 0 : Math.round((value / totalBreakdownValue) * 100)
    }));

    const delta = this.analytics.revenueThisWeek - this.analytics.revenueLastWeek;

    return {
      periodLabel: 'Semaine en cours',
      totalFormatted: this.formatCurrency(this.analytics.revenueThisWeek),
      deltaFormatted: this.formatCurrencyDelta(delta),
      deltaPositive: delta >= 0,
      projection: `Projection mensuelle ${this.formatCurrency(this.analytics.revenueThisWeek * 4)}`,
      timelineLabels: labels,
      timelineSeries: series,
      breakdown
    };
  }

  private computePresenceRate(useLastWeek = false): number {
    const total = useLastWeek ? this.analytics.lastWeekTotal : this.analytics.thisWeekTotal;
    if (total === 0) {
      return 0;
    }

    const confirmed = this.analytics.statusCounts.get(AppointmentStatus.CONFIRMED) ?? 0;
    const completed = this.analytics.statusCounts.get(AppointmentStatus.COMPLETED) ?? 0;
    const cancelled = this.analytics.statusCounts.get(AppointmentStatus.CANCELLED) ?? 0;
    const noShow = this.analytics.statusCounts.get(AppointmentStatus.NO_SHOW) ?? 0;
    const effectiveTotal = confirmed + completed + cancelled + noShow;

    if (effectiveTotal === 0) {
      return 0;
    }

    return ((confirmed + completed) / effectiveTotal) * 100;
  }

  private computeDeltaForStat(title: string, currentValue: number): number | null {
    const normalized = title.toLowerCase();

    if (normalized.includes('aujourd')) {
      return currentValue - this.analytics.yesterdayTotal;
    }

    if (normalized.includes('attente')) {
      return currentValue - this.analytics.pendingLastWeek;
    }

    if (normalized.includes('total')) {
      return currentValue - this.analytics.lastWeekTotal;
    }

    if (normalized.includes('passées') || normalized.includes('consultations')) {
      return currentValue - this.analytics.completedLastMonth;
    }

    if (normalized.includes('venir')) {
      return currentValue - this.analytics.upcomingSeven;
    }

    return null;
  }

  private pickIconForStat(title: string): string {
    const normalized = title.toLowerCase();
    if (normalized.includes('patient') || normalized.includes('utilisateur')) {
      return '🧑‍⚕️';
    }
    if (normalized.includes('rendez')) {
      return '📅';
    }
    if (normalized.includes('consult')) {
      return '🩺';
    }
    if (normalized.includes('demande') || normalized.includes('attente')) {
      return '⏳';
    }
    return '📊';
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  }

  private formatCurrencyDelta(value: number): string {
    const formatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.abs(value));
    return `${value >= 0 ? '+' : '-'}${formatted}`;
  }

  private formatDelta(delta: number): string {
    return `${delta >= 0 ? '+' : ''}${this.formatNumber(delta)}`;
  }

  private getTrendSeries(): { labels: string[]; series: number[] } {
    const labels = this.adminTrends.map((trend) => trend.period);
    const series = this.adminTrends.map((trend) => trend.total);
    return { labels, series };
  }

  private getAppointmentRevenue(appointment: Appointment): number {
    const baseFee = appointment.doctor?.doctorProfile?.consultationFee ?? 65;
    if (appointment.status === AppointmentStatus.CONFIRMED || appointment.status === AppointmentStatus.COMPLETED) {
      return baseFee;
    }
    return 0;
  }

  private createEmptyAnalytics(): AnalyticsSnapshot {
    return {
      statusCounts: new Map<AppointmentStatus, number>(),
      todayTotal: 0,
      yesterdayTotal: 0,
      thisWeekTotal: 0,
      lastWeekTotal: 0,
      pendingThisWeek: 0,
      pendingLastWeek: 0,
      completedThisMonth: 0,
      completedLastMonth: 0,
      upcomingSeven: 0,
      upcomingThirty: 0,
      revenueThisWeek: 0,
      revenueLastWeek: 0,
      weeklyTimeline: [],
      specialtyRevenue: new Map<MedicalSpecialty | string, number>(),
      doctorMetrics: new Map<string, DoctorAccumulator>()
    };
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private addMilliseconds(date: Date, milliseconds: number): Date {
    const copy = new Date(date);
    copy.setTime(copy.getTime() + milliseconds);
    return copy;
  }

  private startOfWeek(reference: Date, weekOffset = 0): Date {
    const start = new Date(reference);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * -7;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getDay(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString('fr-FR', { day: '2-digit' });
  }

  private getMonth(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  }

  private getTime(dateIso: string): string {
    return new Date(dateIso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  private getAppointmentTitle(appointment: Appointment): string {
    if (!this.currentUser) {
      return 'Rendez-vous';
    }

    if (this.currentUser.role === UserRole.PATIENT) {
      return `Dr. ${appointment.doctor?.firstName ?? ''} ${appointment.doctor?.lastName ?? ''}`.trim();
    }

    if (this.currentUser.role === UserRole.DOCTOR) {
      return `${appointment.patient?.firstName ?? ''} ${appointment.patient?.lastName ?? ''}`.trim();
    }

    return `${appointment.patient?.firstName ?? ''} ${appointment.patient?.lastName ?? ''} • Dr. ${appointment.doctor?.firstName ?? ''} ${appointment.doctor?.lastName ?? ''}`.trim();
  }

  private getAppointmentContext(appointment: Appointment): string {
    if (!this.currentUser) {
      return '';
    }

    if (this.currentUser.role === UserRole.PATIENT) {
      return appointment.doctor ? `Avec Dr ${this.formatFullName(appointment.doctor.firstName, appointment.doctor.lastName)}` : 'Médecin à confirmer';
    }

    if (this.currentUser.role === UserRole.DOCTOR) {
      return appointment.patient ? `Avec ${this.formatFullName(appointment.patient.firstName, appointment.patient.lastName)}` : 'Patient à confirmer';
    }

    const doctorName = appointment.doctor ? `Dr ${this.formatFullName(appointment.doctor.firstName, appointment.doctor.lastName)}` : 'Médecin non renseigné';
    const patientName = appointment.patient ? this.formatFullName(appointment.patient.firstName, appointment.patient.lastName) : 'Patient non renseigné';

    return `${patientName} • ${doctorName}`;
  }

  private formatFullName(firstName?: string | null, lastName?: string | null): string {
    const formatted = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    return formatted || 'Non renseigné';
  }
}
