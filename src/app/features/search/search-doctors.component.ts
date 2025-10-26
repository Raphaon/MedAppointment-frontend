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
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DoctorService } from '@app/core/services/doctor.service';
import { DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { DoctorCardComponent } from '@app/shared/components/doctor-card/doctor-card.component';
import { MEDICAL_SPECIALTY_OPTIONS, getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

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
    MatSliderModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DoctorCardComponent
  ],
  templateUrl: './search-doctors.component.html',
  styleUrls: ['./search-doctors.component.scss']

})
export class SearchDoctorsComponent implements OnInit {
  searchForm: FormGroup;
  allDoctors: DoctorProfile[] = [];
  filteredDoctors: DoctorProfile[] = [];
  loading = false;
  sortBy = 'name';

  specialties = MEDICAL_SPECIALTY_OPTIONS;

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
    return getMedicalSpecialtyLabel(specialty);
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