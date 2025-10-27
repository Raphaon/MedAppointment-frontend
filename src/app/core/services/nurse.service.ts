import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { NurseProfile } from '../models';
import { environment } from '../../../environments/environment';

interface NurseProfileResponse {
  profile: NurseProfile;
}

@Injectable({
  providedIn: 'root'
})
export class NurseService {
  private readonly baseUrl = `${environment.apiBaseUrl}/nurses`;

  constructor(private readonly http: HttpClient) {}

  getMyProfile(): Observable<NurseProfileResponse> {
    return this.http.get<NurseProfileResponse>(`${this.baseUrl}/profile/me`);
  }

  createProfile(data: Partial<NurseProfile>): Observable<{ message: string; profile: NurseProfile }> {
    return this.http.post<{ message: string; profile: NurseProfile }>(
      `${this.baseUrl}/profile`,
      data
    );
  }

  updateProfile(data: Partial<NurseProfile>): Observable<{ message: string; profile: NurseProfile }> {
    return this.http.put<{ message: string; profile: NurseProfile }>(
      `${this.baseUrl}/profile`,
      data
    );
  }
}
