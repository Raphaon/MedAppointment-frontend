import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon *ngIf="data.icon" class="dialog-icon">{{ data.icon }}</mat-icon>
      {{ data.title || 'Confirmer l\'action' }}
    </h2>
    <div mat-dialog-content class="dialog-content">
      <p>{{ data.message }}</p>
    </div>
    <div mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="onCancel()">
        {{ data.cancelLabel || 'Annuler' }}
      </button>
      <button mat-raised-button color="warn" (click)="onConfirm()">
        {{ data.confirmLabel || 'Confirmer' }}
      </button>
    </div>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dialog-icon {
      color: #f44336;
    }

    .dialog-content {
      font-size: 15px;
      line-height: 1.5;
    }

    .dialog-actions {
      padding: 8px 0 0;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
