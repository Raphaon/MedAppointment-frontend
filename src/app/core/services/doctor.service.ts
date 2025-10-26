import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly baseUrl = environment.apiBaseUrl;
  private doctorsEndpoint = '/doctors';

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  /**
   * Récupère tous les médecins
   * Essaie plusieurs endpoints en cas d'échec
   */
  getAllDoctors(specialty?: MedicalSpecialty): Observable<{ doctors: DoctorProfile[]; count: number }> {
    let params = new HttpParams();
    
    if (specialty) {
      params = params.set('specialty', specialty);
    }

    this.logger.debug('Chargement des médecins', { specialty });

    // Essayer d'abord /doctors/all
    return this.tryGetDoctors(`${this.baseUrl}${this.doctorsEndpoint}/all`, params).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logger.warn('Endpoint /doctors/all indisponible, tentative de fallback', error);
        
        // Si 404, essayer /doctors sans /all
        if (error.status === 404) {
          return this.tryGetDoctors(`${this.baseUrl}${this.doctorsEndpoint}`, params);
        }
        
        return throwError(() => error);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Essaie de charger les médecins depuis un endpoint donné
   */
  private tryGetDoctors(url: string, params: HttpParams): Observable<{ doctors: DoctorProfile[]; count: number }> {
    return this.http.get<any>(url, { params }).pipe(
      map((response: any) => {
        // Normaliser la réponse selon différents formats possibles
        if (Array.isArray(response)) {
          // Format: [doctor1, doctor2, ...]
          return { doctors: response, count: response.length };
        } else if (response.doctors && Array.isArray(response.doctors)) {
          // Format: { doctors: [...], count: 2 }
          return { doctors: response.doctors, count: response.count || response.doctors.length };
        } else if (response.data && Array.isArray(response.data)) {
          // Format: { data: [...] }
          return { doctors: response.data, count: response.data.length };
        } else {
          throw new Error('Format de réponse invalide du serveur');
        }
      }),
      tap((normalized) => this.logger.info('Médecins chargés', normalized)),
      catchError((error) => {
        this.logger.error('Erreur lors de la normalisation des médecins', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère le profil d'un médecin par son userId
   */
  getDoctorProfile(userId: string): Observable<{ profile: DoctorProfile }> {
    if (!userId || userId.trim() === '') {
      return throwError(() => new Error('userId est requis'));
    }

    return this.http.get<{ profile: DoctorProfile }>(`${this.baseUrl}${this.doctorsEndpoint}/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crée un profil médecin pour l'utilisateur connecté
   */
  createDoctorProfile(data: any): Observable<{ message: string; profile: DoctorProfile }> {
    // Validation des données obligatoires
    if (!data.licenseNumber || !data.specialty || data.yearsExperience === undefined) {
      return throwError(() => new Error('Licence, spécialité et expérience sont requis'));
    }

    return this.http.post<{ message: string; profile: DoctorProfile }>(
      `${this.baseUrl}${this.doctorsEndpoint}/profile`,
      data
    ).pipe(catchError(this.handleError));
  }

  /**
   * Met à jour le profil médecin
   */
  updateDoctorProfile(data: any): Observable<{ message: string; profile: DoctorProfile }> {
    return this.http.put<{ message: string; profile: DoctorProfile }>(
      `${this.baseUrl}${this.doctorsEndpoint}/profile`,
      data
    ).pipe(catchError(this.handleError));
  }

  /**
   * Récupère le profil médecin de l'utilisateur connecté
   */
  getMyDoctorProfile(): Observable<{ profile: DoctorProfile }> {
    return this.http.get<{ profile: DoctorProfile }>(`${this.baseUrl}${this.doctorsEndpoint}/profile/me`).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si 404, c'est normal (pas encore de profil)
        if (error.status === 404) {
          this.logger.info('Aucun profil médecin trouvé pour l\'utilisateur courant');
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
      this.logger.error('Erreur côté client lors de l\'appel médecin', error.error.message);
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur http://localhost:4000';
          this.logger.error('Backend non accessible');
          break;
        case 400:
          errorMessage = error.error?.message || error.error?.error || 'Requête invalide';
          this.logger.warn('Requête invalide (400)', error.error);
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
          this.logger.warn('Non autorisé (401) - Token invalide ou expiré');
          break;
        case 403:
          errorMessage = 'Accès interdit. Vous n\'avez pas les permissions nécessaires.';
          this.logger.warn('Accès interdit (403)');
          break;
        case 404:
          errorMessage = 'Ressource non trouvée. L\'endpoint n\'existe pas sur le serveur.';
          this.logger.warn('Ressource non trouvée (404)', error.url);
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          this.logger.error('Erreur serveur (500)', error.error);
          break;
        default:
          errorMessage = error.error?.message || error.message || `Erreur ${error.status}`;
          this.logger.error(`Erreur HTTP ${error.status}`, error);
      }
    }

    this.logger.error('Détails complets de l\'erreur', error);

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      originalError: error
    }));
  }
}