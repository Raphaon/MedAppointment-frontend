import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MedicalDocument, MedicalDocumentUploadDto, MedicalRecord, MedicalRecordSummaryDto } from '@app/core/models';
import { environment } from '../../../environments/environment';

interface MedicalRecordResponse {
  medicalRecord: MedicalRecord;
}

interface MedicalDocumentsResponse {
  documents: MedicalDocument[];
}

interface MedicalDocumentResponse {
  document: MedicalDocument;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private readonly apiUrl = `${environment.apiBaseUrl}/medical-records`;

  constructor(private readonly http: HttpClient) {}

  createMedicalRecord(patientId: string): Observable<MedicalRecordResponse> {
    return this.http.post<MedicalRecordResponse>(`${this.apiUrl}/${patientId}`, {});
  }

  getMedicalRecord(patientId: string): Observable<MedicalRecordResponse> {
    return this.http.get<MedicalRecordResponse>(`${this.apiUrl}/${patientId}`);
  }

  updateMedicalRecord(patientId: string, data: MedicalRecordSummaryDto): Observable<MedicalRecordResponse> {
    return this.http.patch<MedicalRecordResponse>(`${this.apiUrl}/${patientId}`, data);
  }

  addMedicalDocument(patientId: string, payload: MedicalDocumentUploadDto): Observable<MedicalDocumentResponse> {
    const formData = new FormData();
    formData.append('type', payload.type);
    if (payload.description) {
      formData.append('description', payload.description);
    }
    formData.append('file', payload.file);

    return this.http.post<MedicalDocumentResponse>(`${this.apiUrl}/${patientId}/documents`, formData);
  }

  getMedicalDocuments(patientId: string): Observable<MedicalDocumentsResponse> {
    return this.http.get<MedicalDocumentsResponse>(`${this.apiUrl}/${patientId}/documents`);
  }

  deleteMedicalDocument(documentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/documents/${documentId}`);
  }
}
