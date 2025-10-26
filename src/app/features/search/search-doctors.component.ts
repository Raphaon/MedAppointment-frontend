import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DoctorService } from '@app/core/services/doctor.service';
import { DoctorProfile, MedicalSpecialty } from '@app/core/models';

@Component({
  selector: 'app-search-doctors',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSliderModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="search-container">
      <div class="header">
        <h1>🔍 Recherche avancée de médecins</h1>
        <button mat-raised-button color="primary" routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Retour
        </button>
      </div>

      <mat-card class="search-filters">
        <form [formGroup]="searchForm">
          <div class="filters-grid">
            
            <!-- Recherche par nom -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nom du médecin</mat-label>
              <input matInput formControlName="name" placeholder="Ex: Dr. Dupont">
              <mat-icon matPrefix>person_search</mat-icon>
            </mat-form-field>

            <!-- Spécialité -->
            <mat-form-field appearance="outline">
              <mat-label>Spécialité</mat-label>
              <mat-select formControlName="specialty" multiple>
                <mat-option *ngFor="let specialty of specialties" [value]="specialty.value">
                  {{ specialty.label }}
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>medical_services</mat-icon>
            </mat-form-field>

            <!-- Expérience minimale -->
            <mat-form-field appearance="outline">
              <mat-label>Expérience minimale (années)</mat-label>
              <input matInput type="number" formControlName="minExperience" min="0">
              <mat-icon matPrefix>work</mat-icon>
            </mat-form-field>

            <!-- Tarif maximum -->
            <mat-form-field appearance="outline">
              <mat-label>Tarif maximum (€)</mat-label>
              <input matInput type="number" formControlName="maxFee" min="0">
              <mat-icon matPrefix>euro</mat-icon>
            </mat-form-field>
          </div>

          <div class="filter-actions">
            <button mat-button type="button" (click)="resetFilters()">
              <mat-icon>clear</mat-icon>
              Réinitialiser
            </button>
            <button mat-raised-button color="primary" type="button" (click)="search()">
              <mat-icon>search</mat-icon>
              Rechercher
            </button>
          </div>
        </form>
      </mat-card>

      <!-- Résultats -->
      <div class="results-section">
        <div class="results-header">
          <h2>
            {{ filteredDoctors.length }} médecin(s) trouvé(s)
            <span *ngIf="hasActiveFilters()" class="active-filters-badge">
              {{ getActiveFiltersCount() }} filtre(s) actif(s)
            </span>
          </h2>
          <mat-form-field appearance="outline" class="sort-field">
            <mat-label>Trier par</mat-label>
            <mat-select [(value)]="sortBy" (selectionChange)="sortResults()">
              <mat-option value="name">Nom</mat-option>
              <mat-option value="experience">Expérience</mat-option>
              <mat-option value="fee">Tarif</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Loader -->
        <div class="loading" *ngIf="loading">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Recherche en cours...</p>
        </div>

        <!-- Liste des résultats -->
        <div class="doctors-grid" *ngIf="!loading && filteredDoctors.length > 0">
          <mat-card *ngFor="let doctor of filteredDoctors" class="doctor-card">
            <mat-card-header>
              <div mat-card-avatar class="doctor-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <mat-card-title>
                Dr. {{ doctor.user?.firstName }} {{ doctor.user?.lastName }}
              </mat-card-title>
              <mat-card-subtitle>
                <mat-chip color="primary" selected>
                  {{ getSpecialtyLabel(doctor.specialty) }}
                </mat-chip>
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="doctor-info">
                <div class="info-row highlight" *ngIf="doctor.yearsExperience">
                  <mat-icon>work</mat-icon>
                  <span>{{ doctor.yearsExperience }} ans d'expérience</span>
                </div>

                <div class="info-row highlight" *ngIf="doctor.consultationFee">
                  <mat-icon>euro</mat-icon>
                  <span>{{ doctor.consultationFee }}€ / consultation</span>
                </div>

                <div class="info-row" *ngIf="doctor.availableFrom && doctor.availableTo">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ doctor.availableFrom }} - {{ doctor.availableTo }}</span>
                </div>

                <div class="info-row" *ngIf="doctor.user?.phone">
                  <mat-icon>phone</mat-icon>
                  <span>{{ doctor.user.phone }}</span>
                </div>

                <p class="bio" *ngIf="doctor.bio">{{ doctor.bio }}</p>
              </div>
            </mat-card-content>

            <mat-card-actions>
              <button mat-raised-button color="accent" (click)="bookAppointment(doctor)">
                <mat-icon>event</mat-icon>
                Prendre rendez-vous
              </button>
              <button mat-button (click)="viewDetails(doctor)">
                <mat-icon>info</mat-icon>
                Détails
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

        <!-- Aucun résultat -->
        <div class="no-results" *ngIf="!loading && filteredDoctors.length === 0 && allDoctors.length > 0">
          <mat-icon>search_off</mat-icon>
          <h3>Aucun médecin ne correspond à vos critères</h3>
          <p>Essayez d'élargir vos critères de recherche</p>
          <button mat-raised-button color="primary" (click)="resetFilters()">
            Réinitialiser les filtres
          </button>
        </div>

        <!-- Aucun médecin -->
        <div class="no-data" *ngIf="!loading && allDoctors.length === 0">
          <mat-icon>people_outline</mat-icon>
          <h3>Aucun médecin inscrit</h3>
          <p>Il n'y a pas encore de médecins sur la plateforme</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .search-filters {
      margin-bottom: 32px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .results-section {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .results-header h2 {
      margin: 0;
      color: #333;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .active-filters-badge {
      background-color: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: normal;
    }

    .sort-field {
      width: 200px;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
    }

    .loading p {
      margin-top: 16px;
      color: #666;
    }

    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .doctor-card {
      transition: all 0.3s ease;
    }

    .doctor-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .doctor-avatar {
      background-color: #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
    }

    .doctor-avatar mat-icon {
      color: white;
      font-size: 36px;
      width: 36px;
      height: 36px;
    }

    .doctor-info {
      margin-top: 16px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      color: #666;
    }

    .info-row.highlight {
      color: #333;
      font-weight: 500;
    }

    .info-row mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #667eea;
    }

    .bio {
      margin-top: 16px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      font-style: italic;
      color: #555;
      line-height: 1.6;
    }

    mat-card-actions {
      padding: 16px;
      display: flex;
      gap: 8px;
    }

    mat-card-actions button:first-child {
      flex: 1;
    }

    .no-results, .no-data {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
    }

    .no-results mat-icon, .no-data mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #ccc;
    }

    .no-results h3, .no-data h3 {
      color: #333;
      margin: 16px 0 8px 0;
    }

    .no-results p, .no-data p {
      color: #666;
      margin-bottom: 24px;
    }
  `]
})
export class SearchDoctorsComponent implements OnInit {
  searchForm: FormGroup;
  allDoctors: DoctorProfile[] = [];
  filteredDoctors: DoctorProfile[] = [];
  loading = false;
  sortBy = 'name';

  specialties = [
    { value: MedicalSpecialty.GENERAL_PRACTICE, label: 'Médecine générale' },
    { value: MedicalSpecialty.CARDIOLOGY, label: 'Cardiologie' },
    { value: MedicalSpecialty.DERMATOLOGY, label: 'Dermatologie' },
    { value: MedicalSpecialty.PEDIATRICS, label: 'Pédiatrie' },
    { value: MedicalSpecialty.GYNECOLOGY, label: 'Gynécologie' },
    { value: MedicalSpecialty.ORTHOPEDICS, label: 'Orthopédie' },
    { value: MedicalSpecialty.PSYCHIATRY, label: 'Psychiatrie' },
    { value: MedicalSpecialty.OPHTHALMOLOGY, label: 'Ophtalmologie' },
    { value: MedicalSpecialty.ENT, label: 'ORL' },
    { value: MedicalSpecialty.NEUROLOGY, label: 'Neurologie' },
    { value: MedicalSpecialty.OTHER, label: 'Autre' }
  ];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      name: [''],
      specialty: [[]],
      minExperience: [null],
      maxFee: [null]
    });
  }

  ngOnInit(): void {
    this.loadAllDoctors();

    // Recherche en temps réel sur le nom
    this.searchForm.get('name')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.search();
      });
  }

  loadAllDoctors(): void {
    this.loading = true;
    
    this.doctorService.getAllDoctors().subscribe({
      next: (response: any) => {
        this.allDoctors = response.doctors || [];
        this.filteredDoctors = [...this.allDoctors];
        this.sortResults();
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
      }
    });
  }

  search(): void {
    const { name, specialty, minExperience, maxFee } = this.searchForm.value;

    this.filteredDoctors = this.allDoctors.filter((doctor: DoctorProfile) => {
      // Filtre par nom
      if (name && name.trim()) {
        const fullName = `${doctor.user?.firstName} ${doctor.user?.lastName}`.toLowerCase();
        if (!fullName.includes(name.toLowerCase())) {
          return false;
        }
      }

      // Filtre par spécialité
      if (specialty && specialty.length > 0) {
        if (!specialty.includes(doctor.specialty)) {
          return false;
        }
      }

      // Filtre par expérience minimale
      if (minExperience !== null && minExperience !== undefined) {
        if (!doctor.yearsExperience || doctor.yearsExperience < minExperience) {
          return false;
        }
      }

      // Filtre par tarif maximum
      if (maxFee !== null && maxFee !== undefined) {
        if (!doctor.consultationFee || doctor.consultationFee > maxFee) {
          return false;
        }
      }

      return true;
    });

    this.sortResults();
  }

  sortResults(): void {
    this.filteredDoctors.sort((a: DoctorProfile, b: DoctorProfile) => {
      switch (this.sortBy) {
        case 'name':
          const nameA = `${a.user?.lastName} ${a.user?.firstName}`.toLowerCase();
          const nameB = `${b.user?.lastName} ${b.user?.firstName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        
        case 'experience':
          return (b.yearsExperience || 0) - (a.yearsExperience || 0);
        
        case 'fee':
          return (a.consultationFee || 0) - (b.consultationFee || 0);
        
        default:
          return 0;
      }
    });
  }

  resetFilters(): void {
    this.searchForm.reset({
      name: '',
      specialty: [],
      minExperience: null,
      maxFee: null
    });
    this.filteredDoctors = [...this.allDoctors];
    this.sortResults();
  }

  hasActiveFilters(): boolean {
    const { name, specialty, minExperience, maxFee } = this.searchForm.value;
    return !!(name || (specialty && specialty.length > 0) || minExperience !== null || maxFee !== null);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    const { name, specialty, minExperience, maxFee } = this.searchForm.value;
    
    if (name && name.trim()) count++;
    if (specialty && specialty.length > 0) count++;
    if (minExperience !== null && minExperience !== undefined) count++;
    if (maxFee !== null && maxFee !== undefined) count++;
    
    return count;
  }

  getSpecialtyLabel(specialty: MedicalSpecialty): string {
    const found = this.specialties.find((s: any) => s.value === specialty);
    return found?.label || specialty;
  }

  bookAppointment(doctor: DoctorProfile): void {
    this.router.navigate(['/appointments/create'], { 
      queryParams: { doctorId: doctor.userId } 
    });
  }

  viewDetails(doctor: DoctorProfile): void {
    // TODO: Modal ou page de détails
    this.snackBar.open(`Détails de Dr. ${doctor.user?.firstName} ${doctor.user?.lastName}`, 'Fermer', { duration: 3000 });
  }
}