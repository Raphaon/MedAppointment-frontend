import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  styleUrls: ['./doctors-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorsListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  doctors: DoctorProfile[] = [];
  private allDoctors: DoctorProfile[] = [];
  selectedSpecialty: MedicalSpecialty | null = null;
  readonly specialties = MEDICAL_SPECIALTY_OPTIONS;

  constructor(
    private readonly doctorService: DoctorService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  getSpecialtyLabel(specialty: MedicalSpecialty | undefined): string {
    return specialty ? getMedicalSpecialtyLabel(specialty) : 'Spécialité non renseignée';
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  bookAppointment(doctor: DoctorProfile): void {
    if (!doctor.userId) {
      return;
    }

    this.router.navigate(['/appointments/create'], {
      queryParams: { doctorId: doctor.userId }
    });
  }

  private loadDoctors(): void {
    this.doctorService
      .getAllDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ doctors }) => {
          this.allDoctors = doctors ?? [];
          this.applyFilter();
        },
        error: (error) => {
          const message = error?.message || 'Erreur lors du chargement des médecins';
          this.snackBar.open(message, 'Fermer', { duration: 4000 });
          this.allDoctors = [];
          this.doctors = [];
        }
      });
  }

  private applyFilter(): void {
    if (!this.selectedSpecialty) {
      this.doctors = [...this.allDoctors];
      return;
    }

    this.doctors = this.allDoctors.filter((doctor) => doctor.specialty === this.selectedSpecialty);
  }
}
