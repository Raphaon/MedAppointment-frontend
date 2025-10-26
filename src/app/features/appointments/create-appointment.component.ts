import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService } from '@app/core/services/appointment.service';
import { DoctorService } from '@app/core/services/doctor.service';
import { AuthService } from '@app/core/services/auth.service';
import { DoctorProfile } from '@app/core/models';

@Component({
  selector: 'app-create-appointment',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="create-appointment-container">
      <mat-card class="appointment-card">
        <mat-card-header>
          <mat-card-title>
            <h1>📅 Prendre un rendez-vous</h1>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="appointmentForm" (ngSubmit)="onSubmit()">
            
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Choisir un médecin</mat-label>
              <mat-select formControlName="doctorId" (selectionChange)="onDoctorChange($event)">
                <mat-option *ngFor="let doctor of doctors" [value]="doctor.userId">
                  Dr. {{ doctor.user?.firstName }} {{ doctor.user?.lastName }} 
                  - {{ getSpecialtyLabel(doctor.specialty) }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="appointmentForm.get('doctorId')?.hasError('required')">
                Veuillez choisir un médecin
              </mat-error>
            </mat-form-field>

            <div class="doctor-info" *ngIf="selectedDoctor">
              <mat-icon>info</mat-icon>
              <div>
                <p><strong>Disponibilité :</strong> 
                  {{ selectedDoctor.availableFrom }} - {{ selectedDoctor.availableTo }}
                </p>
                <p *ngIf="selectedDoctor.consultationFee">
                  <strong>Tarif :</strong> {{ selectedDoctor.consultationFee }}€
                </p>
              </div>
            </div>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Date du rendez-vous</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="appointmentDate"
                     [min]="minDate" placeholder="Choisir une date">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-error *ngIf="appointmentForm.get('appointmentDate')?.hasError('required')">
                La date est requise
              </mat-error>
            </mat-form-field>

            <div class="time-fields">
              <mat-form-field appearance="outline">
                <mat-label>Heure</mat-label>
                <mat-select formControlName="hour">
                  <mat-option *ngFor="let hour of hours" [value]="hour">
                    {{ hour }}h
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Minutes</mat-label>
                <mat-select formControlName="minute">
                  <mat-option value="00">00</mat-option>
                  <mat-option value="15">15</mat-option>
                  <mat-option value="30">30</mat-option>
                  <mat-option value="45">45</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Durée (minutes)</mat-label>
              <mat-select formControlName="duration">
                <mat-option [value]="15">15 minutes</mat-option>
                <mat-option [value]="30">30 minutes</mat-option>
                <mat-option [value]="45">45 minutes</mat-option>
                <mat-option [value]="60">1 heure</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Motif de consultation</mat-label>
              <textarea matInput formControlName="reason" rows="3"
                        placeholder="Décrivez brièvement le motif de votre consultation"></textarea>
              <mat-error *ngIf="appointmentForm.get('reason')?.hasError('required')">
                Le motif est requis
              </mat-error>
              <mat-error *ngIf="appointmentForm.get('reason')?.hasError('minlength')">
                Minimum 10 caractères
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Notes additionnelles (optionnel)</mat-label>
              <textarea matInput formControlName="notes" rows="2"
                        placeholder="Informations complémentaires..."></textarea>
            </mat-form-field>

            <div class="actions">
              <button mat-raised-button type="button" routerLink="/doctors">
                Annuler
              </button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="appointmentForm.invalid || loading">
                <span *ngIf="!loading">Confirmer le rendez-vous</span>
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-appointment-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .appointment-card {
      max-width: 600px;
      width: 100%;
    }

    mat-card-title h1 {
      text-align: center;
      color: #667eea;
      margin: 0;
    }

    mat-form-field {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .doctor-info {
      display: flex;
      gap: 12px;
      padding: 16px;
      background-color: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .doctor-info mat-icon {
      color: #1976d2;
    }

    .doctor-info p {
      margin: 4px 0;
      color: #555;
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
export class CreateAppointmentComponent implements OnInit {
  appointmentForm: FormGroup;
  loading = false;
  doctors: DoctorProfile[] = [];
  selectedDoctor: DoctorProfile | null = null;
  minDate = new Date();
  hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h à 19h

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

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.appointmentForm = this.fb.group({
      doctorId: ['', Validators.required],
      appointmentDate: ['', Validators.required],
      hour: ['09', Validators.required],
      minute: ['00', Validators.required],
      duration: [30, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadDoctors();

    // Pré-sélectionner un médecin si passé en paramètre
    this.route.queryParams.subscribe((params: any) => {
      if (params['doctorId']) {
        this.appointmentForm.patchValue({ doctorId: params['doctorId'] });
      }
    });
  }

  loadDoctors(): void {
    this.doctorService.getAllDoctors().subscribe({
      next: (response: any) => {
        this.doctors = response.doctors;
        
        // Si un doctorId est pré-sélectionné, charger ses infos
        const preselectedDoctorId = this.appointmentForm.get('doctorId')?.value;
        if (preselectedDoctorId) {
          this.selectedDoctor = this.doctors.find((d: any) => d.userId === preselectedDoctorId) || null;
        }
      },
      error: (error: any) => {
        this.snackBar.open('Erreur lors du chargement des médecins', 'Fermer', { duration: 3000 });
      }
    });
  }

  onDoctorChange(event: any): void {
    this.selectedDoctor = this.doctors.find((d: any) => d.userId === event.value) || null;
  }

  getSpecialtyLabel(specialty: string): string {
    return this.specialties[specialty] || specialty;
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      this.loading = true;

      const formValue = this.appointmentForm.value;
      const currentUser = this.authService.getCurrentUser();

      if (!currentUser) {
        this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 3000 });
        this.loading = false;
        return;
      }

      // Construire la date complète
      const date = new Date(formValue.appointmentDate);
      date.setHours(parseInt(formValue.hour), parseInt(formValue.minute), 0, 0);

      const appointmentData = {
        doctorId: formValue.doctorId,
        patientId: currentUser.id,
        appointmentDate: date.toISOString(),
        duration: formValue.duration,
        reason: formValue.reason,
        notes: formValue.notes || undefined
      };

      this.appointmentService.createAppointment(appointmentData).subscribe({
        next: () => {
          this.snackBar.open('✅ Rendez-vous créé avec succès !', 'Fermer', { duration: 5000 });
          this.router.navigate(['/appointments']);
        },
        error: (error: any) => {
          this.loading = false;
          const errorMsg = error.error?.error || 'Erreur lors de la création du rendez-vous';
          this.snackBar.open(errorMsg, 'Fermer', { duration: 5000 });
        }
      });
    }
  }
}
