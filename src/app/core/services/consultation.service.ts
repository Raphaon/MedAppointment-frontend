import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CompleteConsultationDto, Consultation, ConsultationEvent } from '../models';

interface ConsultationListResponse {
  consultations: Consultation[];
}

interface ConsultationResponse {
  consultation: Consultation;
  token?: string;
  roomUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private readonly apiUrl = `${environment.apiBaseUrl}/consultations`;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {}

  getConsultationById(id: string): Observable<Consultation> {
    return this.http.get<ConsultationResponse>(`${this.apiUrl}/${id}`).pipe(map(res => res.consultation));
  }

  getDoctorConsultations(doctorId: string): Observable<Consultation[]> {
    return this.http
      .get<ConsultationListResponse>(`${this.apiUrl}/doctor/${doctorId}`)
      .pipe(map(res => res.consultations));
  }

  getPatientConsultations(patientId: string): Observable<Consultation[]> {
    return this.http
      .get<ConsultationListResponse>(`${this.apiUrl}/patient/${patientId}`)
      .pipe(map(res => res.consultations));
  }

  startConsultation(appointmentId: string): Observable<ConsultationResponse> {
    return this.http.post<ConsultationResponse>(`${this.apiUrl}/start/${appointmentId}`, {});
  }

  completeConsultation(appointmentId: string, payload: CompleteConsultationDto): Observable<Consultation> {
    return this.http
      .post<ConsultationResponse>(`${this.apiUrl}/complete/${appointmentId}`, payload)
      .pipe(map(res => res.consultation));
  }

  uploadPrescription(consultationId: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<{ url: string }>(`${this.apiUrl}/upload-prescription/${consultationId}`, formData)
      .pipe(map(res => res.url));
  }

  listenToConsultationEvents(consultationId: string): Observable<ConsultationEvent> {
    return new Observable<ConsultationEvent>((observer) => {
      const eventSource = new EventSource(`${this.apiUrl}/${consultationId}/events`, { withCredentials: true });

      eventSource.onmessage = (event) => {
        this.ngZone.run(() => {
          try {
            const data = JSON.parse(event.data) as ConsultationEvent;
            observer.next(data);
          } catch (error) {
            console.error('Failed to parse consultation event', error);
          }
        });
      };

      eventSource.onerror = () => {
        this.ngZone.run(() => {
          observer.complete();
          eventSource.close();
        });
      };

      return () => eventSource.close();
    });
  }
}
