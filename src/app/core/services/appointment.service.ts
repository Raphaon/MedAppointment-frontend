import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, CreateAppointmentDto, UpdateAppointmentDto, AppointmentStatus } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:4000/api/appointments';

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
}
