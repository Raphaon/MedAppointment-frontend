import { Injectable } from '@angular/core';
import { AppointmentService } from '@app/core/services/appointment.service';
import { AuthService } from '@app/core/services/auth.service';
import { Appointment, AppointmentStatus, User, UserRole } from '@app/core/models';
import { combineLatest, map, shareReplay } from 'rxjs';

export interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  route?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardState {
  private readonly appointments$ = this.appointmentService.getMyAppointments().pipe(
    map(response => response.appointments ?? []),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly stats$ = combineLatest([
    this.authService.currentUser$,
    this.appointments$
  ]).pipe(
    map(([currentUser, appointments]) => this.buildStats(currentUser, appointments)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly upcomingAppointments$ = this.appointments$.pipe(
    map(appointments => this.buildUpcomingAppointments(appointments)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly authService: AuthService
  ) {}

  private buildStats(currentUser: User | null, appointments: Appointment[]): StatCard[] {
    if (!currentUser) {
      return [];
    }

    if (currentUser.role === UserRole.PATIENT) {
      return [
        {
          title: 'Rendez-vous à venir',
          value: appointments.filter(appointment =>
            appointment.status === AppointmentStatus.CONFIRMED ||
            appointment.status === AppointmentStatus.PENDING
          ).length,
          icon: 'event_available',
          color: '#4caf50',
          route: '/appointments'
        },
        {
          title: 'Consultations passées',
          value: appointments.filter(appointment => appointment.status === AppointmentStatus.COMPLETED).length,
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
    }

    if (currentUser.role === UserRole.DOCTOR) {
      return [
        {
          title: 'Patients aujourd\'hui',
          value: appointments.filter(appointment => this.isToday(appointment.appointmentDate)).length,
          icon: 'people',
          color: '#4caf50',
          route: '/calendar'
        },
        {
          title: 'Demandes en attente',
          value: appointments.filter(appointment => appointment.status === AppointmentStatus.PENDING).length,
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
    }

    return [
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
  }

  private buildUpcomingAppointments(appointments: Appointment[]): Appointment[] {
    const now = new Date();

    return appointments
      .filter(appointment => new Date(appointment.appointmentDate) > now)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
      .slice(0, 3);
  }

  private isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();

    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }
}
