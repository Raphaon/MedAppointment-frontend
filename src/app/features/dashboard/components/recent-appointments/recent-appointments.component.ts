import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RecentAppointmentItem {
  id: string;
  day: string;
  month: string;
  time: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  statusEmoji: string;
  context?: string;
}

@Component({
  selector: 'app-recent-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-appointments.component.html',
  styleUrls: ['./recent-appointments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentAppointmentsComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() emptyState = "Aucun rendez-vous à afficher";
  @Input() appointments: RecentAppointmentItem[] = [];
}
