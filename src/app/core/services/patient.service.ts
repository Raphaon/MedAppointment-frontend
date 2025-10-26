import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientProfile } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly apiUrl = `${environment.apiBaseUrl}/patients`;

  constructor(private http: HttpClient) {}

  getAllPatients(): Observable<{ patients: PatientProfile[]; count: number }> {
    return this.http.get<{ patients: PatientProfile[]; count: number }>(`${this.apiUrl}/all`);
  }

  getPatientProfile(userId: string): Observable<{ profile: PatientProfile }> {
    return this.http.get<{ profile: PatientProfile }>(`${this.apiUrl}/${userId}`);
  }

  createPatientProfile(data: any): Observable<{ message: string; profile: PatientProfile }> {
    return this.http.post<{ message: string; profile: PatientProfile }>(`${this.apiUrl}/profile`, data);
  }

  updatePatientProfile(data: any): Observable<{ message: string; profile: PatientProfile }> {
    return this.http.put<{ message: string; profile: PatientProfile }>(`${this.apiUrl}/profile`, data);
  }

  getMyPatientProfile(): Observable<{ profile: PatientProfile }> {
    return this.http.get<{ profile: PatientProfile }>(`${this.apiUrl}/profile/me`);
  }
}
