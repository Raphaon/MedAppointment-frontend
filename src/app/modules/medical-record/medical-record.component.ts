import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MedicalRecordService } from './medical-record.service';
import { MedicalDocument, MedicalRecord, MedicalRecordSummaryDto } from '@app/core/models';
import { MedicalRecordFormComponent } from './medical-record-form.component';
import { MedicalDocumentsComponent, MedicalDocumentUploadEvent } from './medical-documents.component';
import { MedicalDocumentViewerComponent } from './medical-document-viewer.component';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  templateUrl: './medical-record.component.html',
  styleUrls: ['./medical-record.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MedicalRecordFormComponent,
    MedicalDocumentsComponent,
    MedicalDocumentViewerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicalRecordComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly medicalRecordService = inject(MedicalRecordService);

  patientId!: string;
  record: MedicalRecord | null = null;
  documents: MedicalDocument[] = [];
  selectedDocument: MedicalDocument | null = null;

  loadingRecord = true;
  documentsLoading = true;
  savingRecord = false;
  uploadingDocument = false;
  creatingRecord = false;
  deletingDocumentId: string | null = null;
  recordNotFound = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const patientId = params.get('patientId');
      if (!patientId) {
        this.snackBar.open('Patient introuvable', 'Fermer', { duration: 3000 });
        return;
      }

      this.patientId = patientId;
      this.loadRecord();
      this.loadDocuments();
    });
  }

  refresh(): void {
    this.loadRecord();
    this.loadDocuments();
  }

  createRecord(): void {
    if (!this.patientId || this.creatingRecord) {
      return;
    }

    this.creatingRecord = true;
    this.medicalRecordService
      .createMedicalRecord(this.patientId)
      .pipe(take(1))
      .subscribe({
        next: ({ medicalRecord }) => {
          this.record = medicalRecord;
          this.recordNotFound = false;
          this.snackBar.open('Dossier médical créé', 'Fermer', { duration: 3000 });
          this.creatingRecord = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.creatingRecord = false;
          this.snackBar.open(error.error?.message ?? 'Impossible de créer le dossier médical', 'Fermer', {
            duration: 3000
          });
          this.cdr.markForCheck();
        }
      });
  }

  onRecordSave(payload: MedicalRecordSummaryDto): void {
    if (!this.record || this.savingRecord) {
      return;
    }

    this.savingRecord = true;
    this.medicalRecordService
      .updateMedicalRecord(this.patientId, payload)
      .pipe(take(1))
      .subscribe({
        next: ({ medicalRecord }) => {
          this.record = medicalRecord;
          this.snackBar.open('Dossier mis à jour', 'Fermer', { duration: 3000 });
          this.savingRecord = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.savingRecord = false;
          this.snackBar.open(error.error?.message ?? 'Erreur lors de la mise à jour du dossier', 'Fermer', {
            duration: 3000
          });
          this.cdr.markForCheck();
        }
      });
  }

  onDocumentUpload(event: MedicalDocumentUploadEvent): void {
    if (this.uploadingDocument) {
      return;
    }

    this.uploadingDocument = true;
    this.medicalRecordService
      .addMedicalDocument(this.patientId, event)
      .pipe(take(1))
      .subscribe({
        next: ({ document }) => {
          this.documents = [document, ...this.documents];
          this.uploadingDocument = false;
          this.snackBar.open('Document téléversé', 'Fermer', { duration: 3000 });
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.uploadingDocument = false;
          this.snackBar.open(error.error?.message ?? 'Impossible de téléverser le document', 'Fermer', {
            duration: 3000
          });
          this.cdr.markForCheck();
        }
      });
  }

  onDeleteDocument(documentId: string): void {
    if (!documentId) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Supprimer le document',
          message: 'Voulez-vous vraiment supprimer ce document médical ? Cette action est irréversible.',
          confirmLabel: 'Supprimer',
          icon: 'delete'
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.confirmDeleteDocument(documentId);
        }
      });
  }

  onPreviewDocument(document: MedicalDocument): void {
    this.selectedDocument = document;
    this.cdr.markForCheck();
  }

  onCloseViewer(): void {
    this.selectedDocument = null;
    this.cdr.markForCheck();
  }

  private loadRecord(): void {
    if (!this.patientId) {
      return;
    }

    this.loadingRecord = true;
    this.recordNotFound = false;

    this.medicalRecordService
      .getMedicalRecord(this.patientId)
      .pipe(take(1))
      .subscribe({
        next: ({ medicalRecord }) => {
          this.record = medicalRecord;
          this.loadingRecord = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.record = null;
          this.loadingRecord = false;
          this.recordNotFound = error.status === 404;

          if (!this.recordNotFound) {
            this.snackBar.open(error.error?.message ?? 'Erreur lors du chargement du dossier médical', 'Fermer', {
              duration: 3000
            });
          }

          this.cdr.markForCheck();
        }
      });
  }

  private loadDocuments(): void {
    if (!this.patientId) {
      return;
    }

    this.documentsLoading = true;

    this.medicalRecordService
      .getMedicalDocuments(this.patientId)
      .pipe(take(1))
      .subscribe({
        next: ({ documents }) => {
          this.documents = documents;
          this.documentsLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.documents = [];
          this.documentsLoading = false;
          if (error.status !== 404) {
            this.snackBar.open(error.error?.message ?? 'Erreur lors du chargement des documents', 'Fermer', {
              duration: 3000
            });
          }
          this.cdr.markForCheck();
        }
      });
  }

  private confirmDeleteDocument(documentId: string): void {
    this.deletingDocumentId = documentId;
    this.medicalRecordService
      .deleteMedicalDocument(documentId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.documents = this.documents.filter((document) => document.id !== documentId);
          if (this.selectedDocument?.id === documentId) {
            this.selectedDocument = null;
          }
          this.deletingDocumentId = null;
          this.snackBar.open('Document supprimé', 'Fermer', { duration: 3000 });
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.deletingDocumentId = null;
          this.snackBar.open(error.error?.message ?? 'Impossible de supprimer le document', 'Fermer', {
            duration: 3000
          });
          this.cdr.markForCheck();
        }
      });
  }
}
