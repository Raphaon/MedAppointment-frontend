import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NotificationCenterComponent } from '@app/shared/components/notification-center.component';
import { StatCardComponent } from '@app/shared/components/stat-card/stat-card.component';
import { AppointmentService } from '@app/core/services/appointment.service';
import { AuthService } from '@app/core/services/auth.service';
import { DoctorService } from '@app/core/services/doctor.service';
import { UserService } from '@app/core/services/user.service';
import { Appointment, AppointmentStatus, User, UserRole } from '@app/core/models';
import { DashboardState, StatCard } from './dashboard.state';

interface StatusBreakdown {
  status: AppointmentStatus;
  label: string;
  count: number;
}

interface AdminHighlight {
  label: string;
  value: string;
  description?: string;
}

interface AdminTrendItem {
  period: string;
  total: number;
  delta: number;
  confirmed: number;
}

interface QuickAction {
  route: string;
  label: string;
  description: string;
  emoji: string;
  accent: string;
}

interface HeroHighlight {
  emoji: string;
  label: string;
  value: string;
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
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly destroyRef = inject(DestroyRef);

  currentUser: User | null = null;
  stats: StatCard[] = [];
  upcomingAppointments: Appointment[] = [];
  statusBreakdown: StatusBreakdown[] = [];
  adminHighlights: AdminHighlight[] = [];
  adminTrends: AdminTrendItem[] = [];
  private adminStatsLoaded = false;

  readonly UserRole = UserRole;
  readonly AppointmentStatus = AppointmentStatus;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly appointmentService: AppointmentService,
    private readonly userService: UserService,
    private readonly doctorService: DoctorService,
    private readonly dashboardState: DashboardState
  ) {
    this.dashboardState.stats$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        this.stats = stats;
        if (this.currentUser?.role === UserRole.ADMIN) {
          this.loadAdminMetrics();
        }
      });

    this.dashboardState.upcomingAppointments$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((appointments) => {
        this.upcomingAppointments = appointments;
      });

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
        if (user?.role === UserRole.ADMIN) {
          this.loadAdminMetrics();
          this.loadAdminInsights();
        } else {
          this.resetAdminInsights();
        }
      });
  }

  logout(): void {
    this.authService.logout();
  }

  getRoleLabel(): string {
    const role = this.currentUser?.role;
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

  getWelcomeMessage(): string {
    const role = this.currentUser?.role;
    switch (role) {
      case UserRole.ADMIN:
        return 'Gérez l’activité de la plateforme en un coup d’œil.';
      case UserRole.DOCTOR:
        return 'Suivez vos consultations et accompagnez vos patients.';
      case UserRole.PATIENT:
        return 'Organisez vos rendez-vous et suivez votre parcours de soins.';
      default:
        return 'Nous vous souhaitons une excellente journée sur MedAppointment !';
    }
  }

  trackByStat(_: number, stat: StatCard): string {
    return stat.title;
  }

  trackByAction(_: number, action: QuickAction): string {
    return action.route ?? action.label;
  }

  trackByHighlight(_: number, highlight: HeroHighlight): string {
    return highlight.label;
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

  get heroHighlights(): HeroHighlight[] {
    const highlights: HeroHighlight[] = [];
    const next = this.upcomingAppointments[0];

    if (next) {
      highlights.push({
        emoji: '📅',
        label: 'Prochain rendez-vous',
        value: `${this.formatAppointmentDate(next.appointmentDate)} • ${this.getTime(next.appointmentDate)}`
      });
    }

    const role = this.currentUser?.role;

    if (role === UserRole.PATIENT) {
      highlights.push({
        emoji: '🧑‍⚕️',
        label: 'Médecin référent',
        value: next?.doctor ? `Dr ${this.formatFullName(next.doctor.firstName, next.doctor.lastName)}` : 'Sélectionnez votre spécialiste'
      });
    } else if (role === UserRole.DOCTOR) {
      const pending = this.upcomingAppointments.filter((appointment) => appointment.status === AppointmentStatus.PENDING).length;
      highlights.push({
        emoji: '🤝',
        label: 'Suivi patient',
        value: pending > 0 ? `${pending} rendez-vous à confirmer` : 'Agenda parfaitement synchronisé'
      });
    } else if (role === UserRole.ADMIN) {
      const confirmationHighlight = this.adminHighlights.find((highlight) => highlight.label.includes('confirmation'));
      const userStat = this.stats.find((stat) => stat.title.toLowerCase().includes('utilisateur'));

      if (confirmationHighlight) {
        highlights.push({
          emoji: '🚦',
          label: 'Taux de confirmation',
          value: confirmationHighlight.value
        });
      }

      if (userStat) {
        highlights.push({
          emoji: '🌐',
          label: 'Utilisateurs actifs',
          value: `${userStat.value}`
        });
      }
    }

    return highlights;
  }

  getUserInitials(): string {
    const first = this.currentUser?.firstName?.charAt(0) ?? '';
    const last = this.currentUser?.lastName?.charAt(0) ?? '';
    const initials = `${first}${last}`.trim();
    return initials ? initials.toUpperCase() : '🙂';
  }

  getMoodEmoji(): string {
    switch (this.currentUser?.role) {
      case UserRole.ADMIN:
        return '🧭';
      case UserRole.DOCTOR:
        return '🩺';
      case UserRole.PATIENT:
        return '🌿';
      default:
        return '✨';
    }
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

  getDay(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString('fr-FR', { day: '2-digit' });
  }

  getMonth(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  }

  getTime(dateIso: string): string {
    return new Date(dateIso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getAppointmentTitle(appointment: Appointment): string {
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

  getAppointmentContext(appointment: Appointment): string {
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

  private formatAppointmentDate(dateIso: string): string {
    const date = new Date(dateIso);
    const formatted = date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
          this.statusBreakdown = this.buildStatusBreakdown(appointments);
          this.adminHighlights = this.buildAdminHighlights(appointments);
          this.adminTrends = this.buildAdminTrends(appointments);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des rendez-vous administrateur:', error);
          this.resetAdminInsights();
        }
      });
  }

  private resetAdminInsights(): void {
    this.statusBreakdown = [];
    this.adminHighlights = [];
    this.adminTrends = [];
    this.adminStatsLoaded = false;
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

  private buildAdminHighlights(appointments: Appointment[]): AdminHighlight[] {
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

  private buildAdminTrends(appointments: Appointment[]): AdminTrendItem[] {
    const trends: AdminTrendItem[] = [];
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
      return appointmentDate >= now && appointmentDate <= limit;
    }).length;
  }

  private startOfWeek(reference: Date, weekOffset: number): Date {
    const start = new Date(reference);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * -7;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
