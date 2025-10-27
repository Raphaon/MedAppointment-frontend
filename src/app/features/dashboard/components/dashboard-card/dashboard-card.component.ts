import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DashboardCardModel {
  title: string;
  value: string;
  description?: string;
  trendLabel?: string;
  trendValue?: string;
  trendPositive?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-card.component.html',
  styleUrls: ['./dashboard-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardCardComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() description?: string;
  @Input() trendLabel?: string;
  @Input() trendValue?: string;
  @Input() trendPositive: boolean | null = null;
  @Input() icon?: string;
  @Input() accent = 'linear-gradient(135deg, rgba(45, 156, 219, 0.12), rgba(0, 191, 166, 0.1))';
}
