import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ConsultationService } from '@app/core/services/consultation.service';

@Component({
  selector: 'app-prescription-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './prescription-upload.component.html',
  styleUrls: ['./prescription-upload.component.scss']
})
export class PrescriptionUploadComponent {
  @Input() consultationId?: string;
  @Input() label = 'Joindre une ordonnance (PDF)';
  @Input() disabled = false;
  @Output() uploaded = new EventEmitter<string>();

  uploading = false;
  fileName?: string;

  constructor(
    private consultationService: ConsultationService,
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: Event): void {
    if (this.disabled || !this.consultationId) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      this.snackBar.open('Merci de sélectionner un fichier PDF pour la prescription', 'Fermer', { duration: 4000 });
      input.value = '';
      return;
    }

    this.uploading = true;
    this.consultationService.uploadPrescription(this.consultationId, file).subscribe({
      next: (url) => {
        this.uploading = false;
        this.fileName = file.name;
        this.snackBar.open('Prescription téléversée avec succès', 'Fermer', { duration: 3000 });
        this.uploaded.emit(url);
      },
      error: () => {
        this.uploading = false;
        this.snackBar.open('Échec du téléversement de la prescription', 'Fermer', { duration: 4000 });
      }
    });

    input.value = '';
  }
}
