import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CompleteConsultationDto, Consultation } from '@app/core/models';
import { PrescriptionUploadComponent } from './prescription-upload.component';

@Component({
  selector: 'app-consultation-summary',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PrescriptionUploadComponent
  ],
  templateUrl: './consultation-summary.component.html',
  styleUrls: ['./consultation-summary.component.scss']
})
export class ConsultationSummaryComponent implements OnChanges {
  @Input() consultation?: Consultation;
  @Input() saving = false;
  @Output() submitSummary = new EventEmitter<CompleteConsultationDto>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      summary: ['', [Validators.required, Validators.minLength(10)]],
      diagnostics: [''],
      recommendations: [''],
      prescriptionUrl: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['consultation']?.currentValue) {
      this.form.patchValue({
        summary: this.consultation?.summary || '',
        diagnostics: this.consultation?.diagnostics || '',
        recommendations: this.consultation?.recommendations || '',
        prescriptionUrl: this.consultation?.prescriptionUrl || ''
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Merci de détailler le compte rendu de la consultation', 'Fermer', { duration: 4000 });
      return;
    }

    this.submitSummary.emit(this.form.value as CompleteConsultationDto);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onPrescriptionUploaded(url: string): void {
    this.form.patchValue({ prescriptionUrl: url });
  }
}
