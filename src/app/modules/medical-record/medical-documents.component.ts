import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MedicalDocument, MedicalDocumentType } from '@app/core/models';

export interface MedicalDocumentUploadEvent {
  type: MedicalDocumentType | string;
  description?: string | null;
  file: File;
}

@Component({
  selector: 'app-medical-documents',
  standalone: true,
  templateUrl: './medical-documents.component.html',
  styleUrls: ['./medical-documents.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicalDocumentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @Input() documents: MedicalDocument[] = [];
  @Input() loading = false;
  @Input() uploading = false;
  @Input() deletingDocumentId: string | null = null;

  @Output() upload = new EventEmitter<MedicalDocumentUploadEvent>();
  @Output() delete = new EventEmitter<string>();
  @Output() preview = new EventEmitter<MedicalDocument>();

  uploadForm = this.fb.group({
    type: [MedicalDocumentType.PRESCRIPTION, Validators.required],
    description: ['']
  });

  selectedFile: File | null = null;
  uploadError: string | null = null;

  readonly documentTypeOptions = [
    { label: 'Ordonnance', value: MedicalDocumentType.PRESCRIPTION },
    { label: 'Bilan / Analyse', value: MedicalDocumentType.REPORT },
    { label: 'Imagerie', value: MedicalDocumentType.IMAGING },
    { label: 'Autre', value: MedicalDocumentType.OTHER }
  ];

  constructor() {
    this.uploadForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.uploadError = null;
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target?.files?.length) {
      this.selectedFile = null;
      return;
    }

    const file = target.files[0];
    this.selectedFile = file;
    this.uploadError = null;
  }

  triggerFileInput(input: HTMLInputElement): void {
    input.click();
  }

  submitUpload(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Veuillez sélectionner un fichier médical.';
      return;
    }

    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    this.upload.emit({
      type: this.uploadForm.value.type ?? MedicalDocumentType.OTHER,
      description: this.uploadForm.value.description ?? '',
      file: this.selectedFile
    });

    this.uploadForm.reset({ type: MedicalDocumentType.PRESCRIPTION, description: '' });
    this.selectedFile = null;
  }

  onPreview(document: MedicalDocument): void {
    this.preview.emit(document);
  }

  onDelete(document: MedicalDocument): void {
    this.delete.emit(document.id);
  }

  trackByDocumentId(_index: number, document: MedicalDocument): string {
    return document.id;
  }

  formatDocumentType(type: MedicalDocumentType | string): string {
    const mapping: Record<string, string> = {
      [MedicalDocumentType.PRESCRIPTION]: 'Ordonnance',
      [MedicalDocumentType.REPORT]: 'Bilan / Analyse',
      [MedicalDocumentType.IMAGING]: 'Imagerie',
      [MedicalDocumentType.OTHER]: 'Autre'
    };

    return mapping[type] ?? type;
  }
}
