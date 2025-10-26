import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AppointmentService } from '@app/core/services/appointment.service';
import { AuthService } from '@app/core/services/auth.service';
import { Appointment, AppointmentStatus } from '@app/core/models';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  template: `
    <div class="calendar-container">
      <div class="header">
        <h1>📅 Mon Calendrier</h1>
        <button mat-raised-button color="primary" routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Retour
        </button>
      </div>

      <mat-card class="calendar-card">
        <mat-card-header>
          <div class="calendar-nav">
            <button mat-icon-button (click)="previousMonth()">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <h2>{{ getMonthName() }} {{ currentDate.getFullYear() }}</h2>
            <button mat-icon-button (click)="nextMonth()">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="calendar-grid">
            <!-- En-têtes des jours -->
            <div class="day-header" *ngFor="let day of weekDays">
              {{ day }}
            </div>

            <!-- Jours du calendrier -->
            <div *ngFor="let day of calendarDays" 
                 class="calendar-day"
                 [class.other-month]="!day.isCurrentMonth"
                 [class.today]="day.isToday"
                 [class.has-appointments]="day.appointments.length > 0">
              
              <div class="day-number">{{ day.date.getDate() }}</div>
              
              <div class="appointments-list" *ngIf="day.appointments.length > 0">
                <div *ngFor="let appointment of day.appointments" 
                     class="appointment-item"
                     [class.pending]="appointment.status === 'PENDING'"
                     [class.confirmed]="appointment.status === 'CONFIRMED'"
                     [class.cancelled]="appointment.status === 'CANCELLED'"
                     [matTooltip]="getAppointmentTooltip(appointment)">
                  <mat-icon class="appointment-icon">{{ getStatusIcon(appointment.status) }}</mat-icon>
                  <span class="appointment-time">{{ getTime(appointment.appointmentDate) }}</span>
                  <span class="appointment-patient">
                    {{ appointment.patient?.firstName }} {{ appointment.patient?.lastName }}
                  </span>
                </div>
              </div>

              <div class="no-appointments" *ngIf="day.appointments.length === 0 && day.isCurrentMonth">
                <span class="availability-label">Disponible</span>
              </div>
            </div>
          </div>

          <!-- Légende -->
          <div class="legend">
            <h3>Légende</h3>
            <div class="legend-items">
              <div class="legend-item">
                <mat-chip class="pending" selected>
                  <mat-icon>schedule</mat-icon>
                  En attente
                </mat-chip>
              </div>
              <div class="legend-item">
                <mat-chip class="confirmed" selected>
                  <mat-icon>check_circle</mat-icon>
                  Confirmé
                </mat-chip>
              </div>
              <div class="legend-item">
                <mat-chip class="cancelled" selected>
                  <mat-icon>cancel</mat-icon>
                  Annulé
                </mat-chip>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .calendar-container {
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
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .calendar-card {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .calendar-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 16px 0;
    }

    .calendar-nav h2 {
      margin: 0;
      font-size: 24px;
      color: #667eea;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
      margin-top: 24px;
    }

    .day-header {
      text-align: center;
      font-weight: bold;
      color: #667eea;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .calendar-day {
      min-height: 120px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 8px;
      background-color: white;
      transition: all 0.2s;
      position: relative;
    }

    .calendar-day:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }

    .calendar-day.other-month {
      background-color: #fafafa;
      opacity: 0.5;
    }

    .calendar-day.today {
      border-color: #667eea;
      border-width: 3px;
      background-color: #f0f4ff;
    }

    .calendar-day.has-appointments {
      background-color: #fff9e6;
    }

    .day-number {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }

    .today .day-number {
      color: #667eea;
    }

    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .appointment-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .appointment-item:hover {
      transform: translateX(4px);
    }

    .appointment-item.pending {
      background-color: #fff3cd;
      border-left: 3px solid #ffc107;
    }

    .appointment-item.confirmed {
      background-color: #d4edda;
      border-left: 3px solid #28a745;
    }

    .appointment-item.cancelled {
      background-color: #f8d7da;
      border-left: 3px solid #dc3545;
    }

    .appointment-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .appointment-time {
      font-weight: bold;
      color: #333;
    }

    .appointment-patient {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #666;
    }

    .no-appointments {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      color: #999;
      font-style: italic;
    }

    .availability-label {
      font-size: 12px;
    }

    .legend {
      margin-top: 32px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .legend h3 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .legend-items {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .legend-item mat-chip {
      cursor: default;
    }

    .legend-item .pending {
      background-color: #ffc107 !important;
      color: white;
    }

    .legend-item .confirmed {
      background-color: #28a745 !important;
      color: white;
    }

    .legend-item .cancelled {
      background-color: #dc3545 !important;
      color: white;
    }
  `]
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  appointments: Appointment[] = [];
  
  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (response: any) => {
        this.appointments = response.appointments;
        this.generateCalendar();
      },
      error: (error: any) => {
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
      }
    });
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayAppointments = this.getAppointmentsForDay(currentDate);
      
      this.calendarDays.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isToday(currentDate),
        appointments: dayAppointments
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  getAppointmentsForDay(date: Date): Appointment[] {
    return this.appointments.filter((appointment: Appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.getDate() === date.getDate() &&
             appointmentDate.getMonth() === date.getMonth() &&
             appointmentDate.getFullYear() === date.getFullYear();
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.currentDate = new Date(this.currentDate);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.currentDate = new Date(this.currentDate);
    this.generateCalendar();
  }

  getMonthName(): string {
    return this.monthNames[this.currentDate.getMonth()];
  }

  getTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusIcon(status: AppointmentStatus): string {
    const icons: any = {
      PENDING: 'schedule',
      CONFIRMED: 'check_circle',
      CANCELLED: 'cancel',
      COMPLETED: 'done',
      NO_SHOW: 'person_off'
    };
    return icons[status] || 'event';
  }

  getAppointmentTooltip(appointment: Appointment): string {
    const time = this.getTime(appointment.appointmentDate);
    const patient = `${appointment.patient?.firstName} ${appointment.patient?.lastName}`;
    return `${time} - ${patient}\n${appointment.reason}`;
  }
}