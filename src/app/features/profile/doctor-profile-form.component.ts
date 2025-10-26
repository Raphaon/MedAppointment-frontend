import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DoctorService } from '@app/core/services/doctor.service';
import { MedicalSpecialty } from '@app/core/models';

@Component({
  selector: 'app-doctor-profile-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            <h1>👨‍⚕️ {{ isEditing ? 'Modifier' : 'Créer' }} mon profil médecin</h1>
            <p>Complétez vos informations professionnelles</p>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Numéro de licence</mat-label>
              <input matInput formControlName="licenseNumber" placeholder="MD123456">
              <mat-error *ngIf="profileForm.get('licenseNumber')?.hasError('required')">
                Le numéro de licence est requis
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Spécialité</mat-label>
              <mat-select formControlName="specialty">
                <mat-option *ngFor="let specialty of specialties" [value]="specialty.value">
                  {{ specialty.label }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="profileForm.get('specialty')?.hasError('required')">
                La spécialité est requise
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Années d'expérience</mat-label>
              <input matInput type="number" formControlName="yearsExperience" 
                     placeholder="15" min="0">
              <mat-error *ngIf="profileForm.get('yearsExperience')?.hasError('required')">
                L'expérience est requise
              </mat-error>
              <mat-error *ngIf="profileForm.get('yearsExperience')?.hasError('min')">
                Valeur minimale: 0
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Biographie professionnelle</mat-label>
              <textarea matInput formControlName="bio" rows="4"
                        placeholder="Présentez votre parcours et vos compétences..."></textarea>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Tarif de consultation (€)</mat-label>
              <input matInput type="number" formControlName="consultationFee" 
                     placeholder="100" min="0">
              <mat-error *ngIf="profileForm.get('consultationFee')?.hasError('min')">
                Le tarif doit être positif
              </mat-error>
            </mat-form-field>

            <div class="time-fields">
              <mat-form-field appearance="outline">
                <mat-label>Disponible de</mat-label>
                <input matInput type="time" formControlName="availableFrom" 
                       placeholder="09:00">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Disponible jusqu'à</mat-label>
                <input matInput type="time" formControlName="availableTo" 
                       placeholder="17:00">
              </mat-form-field>
            </div>

            <div class="actions">
              <button mat-raised-button type="button" routerLink="/dashboard">
                Annuler
              </button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="profileForm.invalid || loading">
                <span *ngIf="!loading">{{ isEditing ? 'Mettre à jour' : 'Créer le profil' }}</span>
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .form-card {
      max-width: 600px;
      width: 100%;
    }

    mat-card-title h1 {
      text-align: center;
      color: #667eea;
      margin: 0 0 8px 0;
    }

    mat-card-title p {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    mat-form-field {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .time-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .actions {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 24px;
    }

    .actions button {
      flex: 1;
    }

    button mat-spinner {
      display: inline-block;
      margin: 0 auto;
    }
  `]
})
export class DoctorProfileFormComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  isEditing = false;

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
    this.profileForm = this.fb.group({
      licenseNumber: ['', Validators.required],
      specialty: ['', Validators.required],
      yearsExperience: [0, [Validators.required, Validators.min(0)]],
      bio: [''],
      consultationFee: [null, Validators.min(0)],
      availableFrom: ['09:00'],
      availableTo: ['17:00']
    });
  }

  ngOnInit(): void {
    this.loadExistingProfile();
  }

  loadExistingProfile(): void {
    this.doctorService.getMyDoctorProfile().subscribe({
      next: (response: any) => {
        this.isEditing = true;
        const profile = response.profile;
        this.profileForm.patchValue({
          licenseNumber: profile.licenseNumber,
          specialty: profile.specialty,
          yearsExperience: profile.yearsExperience,
          bio: profile.bio || '',
          consultationFee: profile.consultationFee || null,
          availableFrom: profile.availableFrom || '09:00',
          availableTo: profile.availableTo || '17:00'
        });
      },
      error: () => {
        // Pas de profil existant, on reste en mode création
        this.isEditing = false;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      const formData = this.profileForm.value;

      const serviceCall = this.isEditing 
        ? this.doctorService.updateDoctorProfile(formData)
        : this.doctorService.createDoctorProfile(formData);

      serviceCall.subscribe({
        next: () => {
          this.snackBar.open(
            `✅ Profil ${this.isEditing ? 'mis à jour' : 'créé'} avec succès !`, 
            'Fermer', 
            { duration: 3000 }
          );
          this.router.navigate(['/profile']);
        },
        error: (error: any) => {
          this.loading = false;
          const errorMsg = error.error?.error || `Erreur lors de la ${this.isEditing ? 'mise à jour' : 'création'} du profil`;
          this.snackBar.open(errorMsg, 'Fermer', { duration: 5000 });
        }
      });
    }
  }
}
