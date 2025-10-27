import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RevenueBreakdownItem {
  label: string;
  valueFormatted: string;
  percentage: number;
}

export interface RevenueOverviewModel {
  periodLabel: string;
  totalFormatted: string;
  deltaFormatted: string;
  deltaPositive: boolean;
  projection?: string;
  timelineLabels: string[];
  timelineSeries: number[];
  breakdown: RevenueBreakdownItem[];
}

@Component({
  selector: 'app-revenue-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-overview.component.html',
  styleUrls: ['./revenue-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RevenueOverviewComponent implements OnChanges {
  @Input() data?: RevenueOverviewModel;

  sparklinePath = '';
  sparklineFill = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.buildSparkline();
    }
  }

  private buildSparkline(): void {
    if (!this.data?.timelineSeries.length) {
      this.sparklinePath = '';
      this.sparklineFill = '';
      return;
    }

    const series = this.data.timelineSeries;
    const max = Math.max(...series);
    const safeMax = max === 0 ? 1 : max;
    const stepX = series.length > 1 ? 100 / (series.length - 1) : 100;
    const path: string[] = [];
    const fillPoints: string[] = [];

    series.forEach((value, index) => {
      const x = index * stepX;
      const normalized = value / safeMax;
      const y = 36 - normalized * 28;
      path.push(`${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
      fillPoints.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    });

    this.sparklinePath = path.join(' ');
    const firstX = 0;
    const lastX = (series.length - 1) * stepX;
    this.sparklineFill = `M ${firstX.toFixed(2)} 36 ${fillPoints
      .map((point) => `L ${point}`)
      .join(' ')} L ${lastX.toFixed(2)} 36 Z`;
  }
}
