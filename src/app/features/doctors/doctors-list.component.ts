import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '@app/core/services/doctor.service';
import { DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { DoctorCardComponent } from '@app/shared/components/doctor-card/doctor-card.component';
import { MEDICAL_SPECIALTY_OPTIONS, getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

@Component({
  selector: 'app-doctors-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    DoctorCardComponent
  ],
<<<<<<< HEAD
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss']
=======
  template: `
    <div class="doctors-container">
      <div class="header">
        <h1>👨‍⚕️ Nos Médecins</h1>
        <div class="header-actions">
          <button mat-stroked-button color="primary" routerLink="/doctors/search">
            <mat-icon>tune</mat-icon>
            Recherche avancée
          </button>
          <button mat-raised-button color="primary" routerLink="/dashboard">
            <mat-icon>arrow_back</mat-icon>
            Retour
          </button>
        </div>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Filtrer par spécialité</mat-label>
          <mat-select [(ngModel)]="selectedSpecialty" (selectionChange)="onFilterChange()">
            <mat-option [value]="null">Toutes les spécialités</mat-option>
            <mat-option *ngFor="let specialty of specialties" [value]="specialty.value">
              {{ specialty.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="doctors-grid" *ngIf="doctors.length > 0">
        <mat-card *ngFor="let doctor of doctors" class="doctor-card">
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
              <div class="info-row" *ngIf="doctor.yearsExperience">
                <mat-icon>work</mat-icon>
                <span>{{ doctor.yearsExperience }} ans d'expérience</span>
              </div>

              <div class="info-row" *ngIf="doctor.consultationFee">
                <mat-icon>euro</mat-icon>
                <span>{{ doctor.consultationFee }}€ / consultation</span>
              </div>

              <div class="info-row" *ngIf="doctor.availableFrom && doctor.availableTo">
                <mat-icon>schedule</mat-icon>
                <span>Disponible de {{ doctor.availableFrom }} à {{ doctor.availableTo }}</span>
              </div>

              <div class="info-row" *ngIf="doctor.user?.phone">
                <mat-icon>phone</mat-icon>
                <span>{{ doctor.user.phone }}</span>
              </div>

              <div class="info-row" *ngIf="doctor.user?.email">
                <mat-icon>email</mat-icon>
                <span>{{ doctor.user.email }}</span>
              </div>

              <p class="bio" *ngIf="doctor.bio">{{ doctor.bio }}</p>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-raised-button color="accent" (click)="bookAppointment(doctor)">
              <mat-icon>event</mat-icon>
              Prendre rendez-vous
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div class="no-data" *ngIf="doctors.length === 0">
        <mat-icon>people_outline</mat-icon>
        <p>Aucun médecin trouvé</p>
      </div>
    </div>
  `,
  styles: [`
    .doctors-container {
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
      margin-bottom: 32px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .filters {
      margin-bottom: 24px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .filters mat-form-field {
      width: 100%;
      max-width: 400px;
    }

    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .doctor-card {
      transition: transform 0.2s, box-shadow 0.2s;
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

    mat-card-title {
      font-size: 20px !important;
      margin-bottom: 8px !important;
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
      justify-content: center;
    }

    mat-card-actions button {
      width: 100%;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
    }

    .no-data mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #ccc;
    }

    .no-data p {
      color: #666;
      font-size: 18px;
      margin-top: 16px;
    }
  `]
>>>>>>> remotes/origin/codex/conduct-complete-angular-code-review
})
export class DoctorsListComponent implements OnInit {
  doctors: DoctorProfile[] = [];
  selectedSpecialty: MedicalSpecialty | null = null;

  specialties = MEDICAL_SPECIALTY_OPTIONS;

  constructor(
    private doctorService: DoctorService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.doctorService.getAllDoctors(this.selectedSpecialty || undefined).subscribe({
      next: (response: any) => {
        this.doctors = response.doctors;
      },
      error: (error: any) => {
        this.snackBar.open('Erreur lors du chargement des médecins', 'Fermer', { duration: 3000 });
      }
    });
  }

  onFilterChange(): void {
    this.loadDoctors();
  }

  getSpecialtyLabel(specialty: MedicalSpecialty): string {
    return getMedicalSpecialtyLabel(specialty);
  }

  bookAppointment(doctor: DoctorProfile): void {
    // Naviguer vers le formulaire de prise de RDV avec l'ID du médecin
    this.router.navigate(['/appointments/create'], { 
      queryParams: { doctorId: doctor.userId } 
    });
  }
}
