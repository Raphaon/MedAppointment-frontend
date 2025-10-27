import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatsChartType = 'line' | 'pie' | 'bar';

@Component({
  selector: 'app-stats-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-chart.component.html',
  styleUrls: ['./stats-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsChartComponent implements OnChanges {
  @Input() type: StatsChartType = 'line';
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() description?: string;
  @Input() labels: string[] = [];
  @Input() series: number[] = [];
  @Input() accent = 'var(--color-primary)';
  @Input() primaryValue?: string;
  @Input() primaryLabel?: string;

  readonly viewBox = '0 0 100 40';
  linePath = '';
  lineFillPath = '';
  barHeights: { value: number; label: string; height: number }[] = [];
  pieBackground = 'conic-gradient(var(--color-primary) 0 100%)';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['series'] || changes['type'] || changes['labels']) {
      this.updateVisuals();
    }
  }

  private updateVisuals(): void {
    if (!this.series?.length) {
      this.linePath = '';
      this.lineFillPath = '';
      this.barHeights = [];
      this.pieBackground = 'conic-gradient(var(--color-primary) 0 100%)';
      return;
    }

    switch (this.type) {
      case 'pie':
        this.buildPieChart();
        break;
      case 'bar':
        this.buildBarChart();
        break;
      default:
        this.buildLineChart();
        break;
    }
  }

  private buildLineChart(): void {
    const max = Math.max(...this.series);
    const safeMax = max === 0 ? 1 : max;
    const points: string[] = [];
    const fillPoints: string[] = [];
    const stepX = this.series.length > 1 ? 100 / (this.series.length - 1) : 100;

    this.series.forEach((value, index) => {
      const x = index * stepX;
      const normalized = value / safeMax;
      const y = 36 - normalized * 28;
      points.push(`${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
      fillPoints.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    });

    this.linePath = points.join(' ');
    const firstX = 0;
    const lastX = (this.series.length - 1) * stepX;
    this.lineFillPath = `M ${firstX.toFixed(2)} 36 ${fillPoints
      .map((point) => `L ${point}`)
      .join(' ')} L ${lastX.toFixed(2)} 36 Z`;
  }

  private buildPieChart(): void {
    const total = this.series.reduce((acc, value) => acc + value, 0);
    if (total === 0) {
      this.pieBackground = 'conic-gradient(var(--color-primary) 0 100%)';
      return;
    }

    const segments: string[] = [];
    let current = 0;
    this.series.forEach((value, index) => {
      const percentage = (value / total) * 100;
      const color = this.getPaletteColor(index);
      const next = current + percentage;
      segments.push(`${color} ${current.toFixed(2)}% ${next.toFixed(2)}%`);
      current = next;
    });

    this.pieBackground = `conic-gradient(${segments.join(', ')})`;
  }

  private buildBarChart(): void {
    const max = Math.max(...this.series);
    const safeMax = max === 0 ? 1 : max;
    this.barHeights = this.series.map((value, index) => ({
      value,
      label: this.labels[index] ?? '',
      height: Math.max(6, Math.round((value / safeMax) * 100))
    }));
  }

  getPaletteColor(index: number): string {
    const palette = [
      'var(--color-primary)',
      'var(--color-success)',
      'var(--color-info)',
      'var(--color-warning)',
      '#94a3b8',
      '#0ea5e9'
    ];
    return palette[index % palette.length];
  }
}
