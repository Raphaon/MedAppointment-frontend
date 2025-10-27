import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CompleteConsultationDto,
  Consultation,
  CreateMedicalRecordEntryDto,
  MedicalRecordEntry,
  StartConsultationDto,
  UpdateConsultationDto
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private readonly apiUrl = `${environment.apiBaseUrl}/consultations`;
  private readonly medicalRecordUrl = `${environment.apiBaseUrl}/medical-records`;

  constructor(private readonly http: HttpClient) {}

  getConsultationByAppointment(appointmentId: string): Observable<{ consultation: Consultation | null }> {
    return this.http.get<{ consultation: Consultation | null }>(`${this.apiUrl}/by-appointment/${appointmentId}`);
  }

  startConsultation(data: StartConsultationDto): Observable<{ consultation: Consultation }> {
    return this.http.post<{ consultation: Consultation }>(this.apiUrl, data);
  }

  updateConsultation(id: string, data: UpdateConsultationDto): Observable<{ consultation: Consultation }> {
    return this.http.put<{ consultation: Consultation }>(`${this.apiUrl}/${id}`, data);
  }

  completeConsultation(id: string, data: CompleteConsultationDto): Observable<{ consultation: Consultation }> {
    return this.http.patch<{ consultation: Consultation }>(`${this.apiUrl}/${id}/complete`, data);
  }

  addMedicalRecordEntry(
    consultationId: string,
    data: CreateMedicalRecordEntryDto
  ): Observable<{ record: MedicalRecordEntry; consultation: Consultation }> {
    return this.http.post<{ record: MedicalRecordEntry; consultation: Consultation }>(
      `${this.apiUrl}/${consultationId}/records`,
      data
    );
  }

  deleteMedicalRecordEntry(consultationId: string, recordId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${consultationId}/records/${recordId}`);
  }

  getPatientRecords(patientId: string): Observable<{ records: MedicalRecordEntry[] }> {
    return this.http.get<{ records: MedicalRecordEntry[] }>(`${this.medicalRecordUrl}/patient/${patientId}`);
  }
}
