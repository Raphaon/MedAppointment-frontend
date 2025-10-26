import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '@app/core/services/auth.service';
import { User, UserRole } from '@app/core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule
  ],
  template: `
    <div class="profile-container">
      <div class="header">
        <h1>👤 Mon Profil</h1>
        <button mat-raised-button color="primary" routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Retour
        </button>
      </div>

      <mat-card class="profile-card" *ngIf="currentUser">
        <mat-card-header>
          <div mat-card-avatar class="profile-avatar">
            <mat-icon>{{ getAvatarIcon() }}</mat-icon>
          </div>
          <mat-card-title>
            {{ currentUser.firstName }} {{ currentUser.lastName }}
          </mat-card-title>
          <mat-card-subtitle>
            <mat-chip [color]="getRoleColor()" selected>
              {{ getRoleLabel() }}
            </mat-chip>
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-tab-group>
            <!-- Onglet Informations générales -->
            <mat-tab label="Informations générales">
              <div class="tab-content">
                <div class="info-section">
                  <h3>📧 Contact</h3>
                  <div class="info-row">
                    <mat-icon>email</mat-icon>
                    <span>{{ currentUser.email }}</span>
                  </div>
                  <div class="info-row" *ngIf="currentUser.phone">
                    <mat-icon>phone</mat-icon>
                    <span>{{ currentUser.phone }}</span>
                  </div>
                </div>

                <div class="info-section">
                  <h3>🔐 Compte</h3>
                  <div class="info-row">
                    <mat-icon>badge</mat-icon>
                    <span>{{ currentUser.id }}</span>
                  </div>
                  <div class="info-row">
                    <mat-icon>calendar_today</mat-icon>
                    <span>Membre depuis {{ currentUser.createdAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="info-row">
                    <mat-icon>{{ currentUser.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
                    <span>Compte {{ currentUser.isActive ? 'actif' : 'inactif' }}</span>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Onglet Profil Médecin (si docteur) -->
            <mat-tab label="Profil Médecin" *ngIf="currentUser.role === UserRole.DOCTOR && currentUser.doctorProfile">
              <div class="tab-content">
                <div class="info-section">
                  <h3>👨‍⚕️ Informations professionnelles</h3>
                  <div class="info-row">
                    <mat-icon>assignment_ind</mat-icon>
                    <span>N° Licence: {{ currentUser.doctorProfile.licenseNumber }}</span>
                  </div>
                  <div class="info-row">
                    <mat-icon>medical_services</mat-icon>
                    <span>{{ getSpecialtyLabel(currentUser.doctorProfile.specialty) }}</span>
                  </div>
                  <div class="info-row">
                    <mat-icon>work</mat-icon>
                    <span>{{ currentUser.doctorProfile.yearsExperience }} ans d'expérience</span>
                  </div>
                  <div class="info-row" *ngIf="currentUser.doctorProfile.consultationFee">
                    <mat-icon>euro</mat-icon>
                    <span>{{ currentUser.doctorProfile.consultationFee }}€ / consultation</span>
                  </div>
                  <div class="info-row" *ngIf="currentUser.doctorProfile.availableFrom">
                    <mat-icon>schedule</mat-icon>
                    <span>Disponible de {{ currentUser.doctorProfile.availableFrom }} 
                          à {{ currentUser.doctorProfile.availableTo }}</span>
                  </div>
                </div>

                <div class="info-section" *ngIf="currentUser.doctorProfile.bio">
                  <h3>📝 Biographie</h3>
                  <p class="bio">{{ currentUser.doctorProfile.bio }}</p>
                </div>
              </div>
            </mat-tab>

            <!-- Onglet Profil Patient (si patient) -->
            <mat-tab label="Profil Patient" *ngIf="currentUser.role === UserRole.PATIENT && currentUser.patientProfile">
              <div class="tab-content">
                <div class="info-section">
                  <h3>🏥 Informations médicales</h3>
                  <div class="info-row" *ngIf="currentUser.patientProfile.dateOfBirth">
                    <mat-icon>cake</mat-icon>
                    <span>{{ currentUser.patientProfile.dateOfBirth | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="info-row" *ngIf="currentUser.patientProfile.bloodGroup">
                    <mat-icon>water_drop</mat-icon>
                    <span>Groupe sanguin: {{ currentUser.patientProfile.bloodGroup }}</span>
                  </div>
                  <div class="info-row" *ngIf="currentUser.patientProfile.allergies">
                    <mat-icon>warning</mat-icon>
                    <span>Allergies: {{ currentUser.patientProfile.allergies }}</span>
                  </div>
                  <div class="info-row" *ngIf="currentUser.patientProfile.emergencyContact">
                    <mat-icon>contact_phone</mat-icon>
                    <span>Contact urgence: {{ currentUser.patientProfile.emergencyContact }}</span>
                  </div>
                </div>

                <div class="info-section" *ngIf="currentUser.patientProfile.medicalHistory">
                  <h3>📋 Historique médical</h3>
                  <p class="bio">{{ currentUser.patientProfile.medicalHistory }}</p>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="accent" 
                  routerLink="/profile/edit-doctor"
                  *ngIf="currentUser?.role === UserRole.DOCTOR">
            <mat-icon>edit</mat-icon>
            {{ currentUser?.doctorProfile ? 'Modifier' : 'Créer' }} mon profil médecin
          </button>

          <button mat-raised-button color="accent"
                  routerLink="/profile/edit-patient"
                  *ngIf="currentUser?.role === UserRole.PATIENT">
            <mat-icon>edit</mat-icon>
            {{ currentUser?.patientProfile ? 'Modifier' : 'Créer' }} mon profil patient
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 24px;
      max-width: 900px;
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

    .profile-card {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .profile-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
    }

    .profile-avatar mat-icon {
      color: white;
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    mat-card-title {
      font-size: 24px !important;
      margin-top: 8px !important;
    }

    .tab-content {
      padding: 24px 0;
    }

    .info-section {
      margin-bottom: 32px;
    }

    .info-section h3 {
      color: #667eea;
      margin-bottom: 16px;
      font-size: 18px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      margin-bottom: 8px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }

    .info-row mat-icon {
      color: #667eea;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-row span {
      color: #555;
      font-size: 15px;
    }

    .bio {
      padding: 16px;
      background-color: #f9f9f9;
      border-radius: 8px;
      line-height: 1.6;
      color: #555;
      white-space: pre-wrap;
    }

    mat-card-actions {
      padding: 16px;
      display: flex;
      justify-content: center;
    }

    mat-card-actions button {
      min-width: 200px;
    }
  `]
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  UserRole = UserRole;

  specialties: any = {
    GENERAL_PRACTICE: 'Médecine générale',
    CARDIOLOGY: 'Cardiologie',
    DERMATOLOGY: 'Dermatologie',
    PEDIATRICS: 'Pédiatrie',
    GYNECOLOGY: 'Gynécologie',
    ORTHOPEDICS: 'Orthopédie',
    PSYCHIATRY: 'Psychiatrie',
    OPHTHALMOLOGY: 'Ophtalmologie',
    ENT: 'ORL',
    NEUROLOGY: 'Neurologie',
    OTHER: 'Autre'
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });
  }

  getRoleLabel(): string {
    const labels: any = {
      [UserRole.ADMIN]: 'Administrateur',
      [UserRole.DOCTOR]: 'Médecin',
      [UserRole.PATIENT]: 'Patient'
    };
    return labels[this.currentUser?.role || ''] || 'Utilisateur';
  }

  getRoleColor(): string {
    const colors: any = {
      [UserRole.ADMIN]: 'warn',
      [UserRole.DOCTOR]: 'primary',
      [UserRole.PATIENT]: 'accent'
    };
    return colors[this.currentUser?.role || ''] || '';
  }

  getAvatarIcon(): string {
    const icons: any = {
      [UserRole.ADMIN]: 'admin_panel_settings',
      [UserRole.DOCTOR]: 'local_hospital',
      [UserRole.PATIENT]: 'person'
    };
    return icons[this.currentUser?.role || ''] || 'person';
  }

  getSpecialtyLabel(specialty: string): string {
    return this.specialties[specialty] || specialty;
  }
}
