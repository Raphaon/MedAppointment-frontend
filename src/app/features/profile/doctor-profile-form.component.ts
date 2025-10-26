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
import { MEDICAL_SPECIALTY_OPTIONS } from '@app/shared/constants/medical.constants';

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
  templateUrl: './doctor-profile-form.component.html',
  styleUrls: ['./doctor-profile-form.component.scss']

})
export class DoctorProfileFormComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  isEditing = false;

  specialties = MEDICAL_SPECIALTY_OPTIONS;

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
