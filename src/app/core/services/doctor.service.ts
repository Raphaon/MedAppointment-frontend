import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly baseUrl = environment.apiBaseUrl;
  private doctorsEndpoint = '/doctors';

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les médecins
   * Essaie plusieurs endpoints en cas d'échec
   */
  getAllDoctors(specialty?: MedicalSpecialty): Observable<{ doctors: DoctorProfile[]; count: number }> {
    let params = new HttpParams();
    
    if (specialty) {
      params = params.set('specialty', specialty);
    }

    console.log('📥 Tentative de chargement des médecins...', { specialty });

    // Essayer d'abord /doctors/all
    return this.tryGetDoctors(`${this.baseUrl}${this.doctorsEndpoint}/all`, params).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn('⚠️ Endpoint /doctors/all non trouvé, essai de /doctors...');
        
        // Si 404, essayer /doctors sans /all
        if (error.status === 404) {
          return this.tryGetDoctors(`${this.baseUrl}${this.doctorsEndpoint}`, params);
        }
        
        return throwError(() => error);
      }),
      tap((response: any) => {
        console.log('✅ Médecins chargés avec succès:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Essaie de charger les médecins depuis un endpoint donné
   */
  private tryGetDoctors(url: string, params: HttpParams): Observable<{ doctors: DoctorProfile[]; count: number }> {
    console.log('🌐 Requête GET:', url);
    
    return this.http.get<any>(url, { params }).pipe(
      tap((response: any) => {
        console.log('📦 Réponse brute:', response);
      }),
      switchMap((response: any) => {
        // Normaliser la réponse selon différents formats possibles
        if (Array.isArray(response)) {
          // Format: [doctor1, doctor2, ...]
          return of({ doctors: response, count: response.length });
        } else if (response.doctors && Array.isArray(response.doctors)) {
          // Format: { doctors: [...], count: 2 }
          return of({ doctors: response.doctors, count: response.count || response.doctors.length });
        } else if (response.data && Array.isArray(response.data)) {
          // Format: { data: [...] }
          return of({ doctors: response.data, count: response.data.length });
        } else {
          console.error('❌ Format de réponse non reconnu:', response);
          throw new Error('Format de réponse invalide du serveur');
        }
      })
    );
  }

  /**
   * Récupère le profil d'un médecin par son userId
   */
  getDoctorProfile(userId: string): Observable<{ profile: DoctorProfile }> {
    if (!userId || userId.trim() === '') {
      console.error('❌ userId manquant ou vide');
      return throwError(() => new Error('userId est requis'));
    }

    console.log('📥 Chargement du profil médecin:', userId);

    return this.http.get<{ profile: DoctorProfile }>(`${this.baseUrl}${this.doctorsEndpoint}/${userId}`).pipe(
      tap((response: any) => {
        console.log('✅ Profil médecin chargé:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Crée un profil médecin pour l'utilisateur connecté
   */
  createDoctorProfile(data: any): Observable<{ message: string; profile: DoctorProfile }> {
    console.log('📤 Création du profil médecin:', data);
    
    // Validation des données obligatoires
    if (!data.licenseNumber || !data.specialty || data.yearsExperience === undefined) {
      console.error('❌ Données obligatoires manquantes');
      return throwError(() => new Error('Licence, spécialité et expérience sont requis'));
    }

    return this.http.post<{ message: string; profile: DoctorProfile }>(
      `${this.baseUrl}${this.doctorsEndpoint}/profile`, 
      data
    ).pipe(
      tap((response: any) => {
        console.log('✅ Profil médecin créé:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour le profil médecin
   */
  updateDoctorProfile(data: any): Observable<{ message: string; profile: DoctorProfile }> {
    console.log('📤 Mise à jour du profil médecin:', data);

    return this.http.put<{ message: string; profile: DoctorProfile }>(
      `${this.baseUrl}${this.doctorsEndpoint}/profile`, 
      data
    ).pipe(
      tap((response: any) => {
        console.log('✅ Profil médecin mis à jour:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère le profil médecin de l'utilisateur connecté
   */
  getMyDoctorProfile(): Observable<{ profile: DoctorProfile }> {
    console.log('📥 Chargement de mon profil médecin...');

    return this.http.get<{ profile: DoctorProfile }>(`${this.baseUrl}${this.doctorsEndpoint}/profile/me`).pipe(
      tap((response: any) => {
        console.log('✅ Mon profil médecin:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        // Si 404, c'est normal (pas encore de profil)
        if (error.status === 404) {
          console.log('ℹ️ Aucun profil médecin trouvé (normal si pas encore créé)');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur client: ${error.error.message}`;
      console.error('❌ Erreur client:', error.error.message);
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur http://localhost:4000';
          console.error('❌ Backend non accessible');
          break;
        case 400:
          errorMessage = error.error?.message || error.error?.error || 'Requête invalide';
          console.error('❌ Requête invalide (400):', error.error);
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
          console.error('❌ Non autorisé (401) - Token invalide ou expiré');
          break;
        case 403:
          errorMessage = 'Accès interdit. Vous n\'avez pas les permissions nécessaires.';
          console.error('❌ Accès interdit (403)');
          break;
        case 404:
          errorMessage = 'Ressource non trouvée. L\'endpoint n\'existe pas sur le serveur.';
          console.error('❌ Ressource non trouvée (404):', error.url);
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          console.error('❌ Erreur serveur (500):', error.error);
          break;
        default:
          errorMessage = error.error?.message || error.message || `Erreur ${error.status}`;
          console.error(`❌ Erreur HTTP ${error.status}:`, error);
      }
    }

    console.error('📋 Détails complets de l\'erreur:', error);

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      originalError: error
    }));
  }
}