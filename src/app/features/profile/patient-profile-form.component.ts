import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '@app/core/services/patient.service';

@Component({
  selector: 'app-patient-profile-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            <h1>🏥 {{ isEditing ? 'Modifier' : 'Créer' }} mon profil patient</h1>
            <p>Complétez vos informations médicales</p>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Date de naissance</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="dateOfBirth"
                     [max]="maxDate" placeholder="Choisir une date">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Groupe sanguin</mat-label>
              <input matInput formControlName="bloodGroup" 
                     placeholder="A+, B-, O+, AB-, etc.">
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Allergies</mat-label>
              <textarea matInput formControlName="allergies" rows="3"
                        placeholder="Pénicilline, pollen, arachides..."></textarea>
              <mat-hint>Séparez les allergies par des virgules</mat-hint>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Historique médical</mat-label>
              <textarea matInput formControlName="medicalHistory" rows="4"
                        placeholder="Maladies chroniques, opérations antérieures, traitements en cours..."></textarea>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Contact d'urgence</mat-label>
              <input matInput formControlName="emergencyContact"
                     placeholder="+33612345678 (Prénom Nom - Relation)">
              <mat-hint>Numéro et nom de la personne à contacter en cas d'urgence</mat-hint>
            </mat-form-field>

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
export class PatientProfileFormComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  isEditing = false;
  maxDate = new Date();

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      dateOfBirth: [null],
      bloodGroup: [''],
      allergies: [''],
      medicalHistory: [''],
      emergencyContact: ['']
    });
  }

  ngOnInit(): void {
    this.loadExistingProfile();
  }

  loadExistingProfile(): void {
    this.patientService.getMyPatientProfile().subscribe({
      next: (response: any) => {
        this.isEditing = true;
        const profile = response.profile;
        this.profileForm.patchValue({
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
          bloodGroup: profile.bloodGroup || '',
          allergies: profile.allergies || '',
          medicalHistory: profile.medicalHistory || '',
          emergencyContact: profile.emergencyContact || ''
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
      const formData = { ...this.profileForm.value };

      // Convertir la date en ISO string si elle existe
      if (formData.dateOfBirth) {
        formData.dateOfBirth = new Date(formData.dateOfBirth).toISOString();
      }

      const serviceCall = this.isEditing 
        ? this.patientService.updatePatientProfile(formData)
        : this.patientService.createPatientProfile(formData);

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
