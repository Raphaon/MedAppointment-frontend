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
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss']
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
