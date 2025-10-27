import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentDto,
  CreatePrescriptionDto,
  PatientVital,
  Prescription,
  RecordPatientVitalDto,
  UpdateAppointmentDto,
  UpdatePrescriptionDto
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly apiUrl = `${environment.apiBaseUrl}/appointments`;

  constructor(private http: HttpClient) {}

  createAppointment(data: CreateAppointmentDto): Observable<{ message: string; appointment: Appointment }> {
    return this.http.post<{ message: string; appointment: Appointment }>(this.apiUrl, data);
  }

  getMyAppointments(status?: AppointmentStatus): Observable<{ appointments: Appointment[]; count: number }> {
    const params = status ? { status } : {};
    return this.http.get<{ appointments: Appointment[]; count: number }>(`${this.apiUrl}/my-appointments`, { params });
  }

  getAppointmentById(id: string): Observable<{ appointment: Appointment }> {
    return this.http.get<{ appointment: Appointment }>(`${this.apiUrl}/${id}`);
  }

  updateAppointment(id: string, data: UpdateAppointmentDto): Observable<{ message: string; appointment: Appointment }> {
    return this.http.put<{ message: string; appointment: Appointment }>(`${this.apiUrl}/${id}`, data);
  }

  cancelAppointment(id: string): Observable<{ message: string; appointment: Appointment }> {
    return this.http.patch<{ message: string; appointment: Appointment }>(`${this.apiUrl}/${id}/cancel`, {});
  }

  deleteAppointment(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getAllAppointments(status?: AppointmentStatus): Observable<{ appointments: Appointment[]; count: number }> {
    const params = status ? { status } : {};
    return this.http.get<{ appointments: Appointment[]; count: number }>(`${this.apiUrl}/all`, { params });
  }

  getDoctorAppointments(
    doctorId: string,
    start?: string,
    end?: string
  ): Observable<{ appointments: Appointment[]; count?: number }> {
    const params: Record<string, string> = {};
    if (start) {
      params['start'] = start;
    }
    if (end) {
      params['end'] = end;
    }

    return this.http.get<{ appointments: Appointment[]; count?: number }>(
      `${this.apiUrl}/doctor/${doctorId}`,
      { params }
    );
  }

  recordPatientVitals(
    appointmentId: string,
    data: RecordPatientVitalDto
  ): Observable<{ message: string; vital: PatientVital }> {
    return this.http.post<{ message: string; vital: PatientVital }>(
      `${this.apiUrl}/${appointmentId}/vitals`,
      data
    );
  }

  getPatientVitals(appointmentId: string): Observable<{ vitals: PatientVital[] }> {
    return this.http.get<{ vitals: PatientVital[] }>(
      `${this.apiUrl}/${appointmentId}/vitals`
    );
  }

  createPrescription(
    appointmentId: string,
    data: CreatePrescriptionDto
  ): Observable<{ message: string; prescription: Prescription }> {
    return this.http.post<{ message: string; prescription: Prescription }>(
      `${this.apiUrl}/${appointmentId}/prescriptions`,
      data
    );
  }

  updatePrescription(
    appointmentId: string,
    prescriptionId: string,
    data: UpdatePrescriptionDto
  ): Observable<{ message: string; prescription: Prescription }> {
    return this.http.put<{ message: string; prescription: Prescription }>(
      `${this.apiUrl}/${appointmentId}/prescriptions/${prescriptionId}`,
      data
    );
  }

  deletePrescription(appointmentId: string, prescriptionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${appointmentId}/prescriptions/${prescriptionId}`
    );
  }
}
