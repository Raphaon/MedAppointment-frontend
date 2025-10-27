import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CreateHospitalDto,
  Hospital,
  HospitalDepartment,
  UpdateHospitalDto,
  UpsertHospitalDepartmentDto
} from '../models';
import { environment } from '../../../environments/environment';

interface HospitalListResponse {
  hospitals: Hospital[];
  count: number;
}

interface HospitalResponse {
  hospital: Hospital;
}

interface DepartmentResponse {
  department: HospitalDepartment;
}

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private readonly apiUrl = `${environment.apiBaseUrl}/hospitals`;

  constructor(private readonly http: HttpClient) {}

  getHospitals(search?: string): Observable<HospitalListResponse> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<HospitalListResponse>(this.apiUrl, { params });
  }

  getHospitalById(id: string): Observable<HospitalResponse> {
    return this.http.get<HospitalResponse>(`${this.apiUrl}/${id}`);
  }

  createHospital(data: CreateHospitalDto): Observable<HospitalResponse> {
    return this.http.post<HospitalResponse>(this.apiUrl, data);
  }

  updateHospital(id: string, data: UpdateHospitalDto): Observable<HospitalResponse> {
    return this.http.put<HospitalResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteHospital(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  upsertDepartment(
    hospitalId: string,
    departmentId: string | null,
    data: UpsertHospitalDepartmentDto
  ): Observable<DepartmentResponse> {
    if (departmentId) {
      return this.http.put<DepartmentResponse>(
        `${this.apiUrl}/${hospitalId}/departments/${departmentId}`,
        data
      );
    }

    return this.http.post<DepartmentResponse>(
      `${this.apiUrl}/${hospitalId}/departments`,
      data
    );
  }

  deleteDepartment(hospitalId: string, departmentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${hospitalId}/departments/${departmentId}`
    );
  }
}
