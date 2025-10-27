import { Component, DestroyRef, OnInit, inject } from '@angular/core';
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
import { HospitalService } from '@app/core/services/hospital.service';
import { Hospital, HospitalDepartment, MedicalSpecialty } from '@app/core/models';
import { MEDICAL_SPECIALTY_OPTIONS } from '@app/shared/constants/medical.constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private readonly destroyRef = inject(DestroyRef);
  profileForm: FormGroup;
  loading = false;
  isEditing = false;

  specialties = MEDICAL_SPECIALTY_OPTIONS;
  hospitals: Hospital[] = [];
  departments: HospitalDepartment[] = [];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private hospitalService: HospitalService,
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
      availableTo: ['17:00'],
      hospitalIds: [[]],
      departmentIds: [[]]
    });
  }

  ngOnInit(): void {
    this.loadExistingProfile();
    this.loadHospitals();
    this.watchHospitalSelection();
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
          availableTo: profile.availableTo || '17:00',
          hospitalIds: profile.hospitalIds ?? profile.hospitals?.map((h: Hospital) => h.id) ?? [],
          departmentIds: profile.departmentIds ?? profile.departments?.map((d: HospitalDepartment) => d.id) ?? []
        });
        this.filterDepartments();
      },
      error: () => {
        // Pas de profil existant, on reste en mode création
        this.isEditing = false;
      }
    });
  }

  loadHospitals(): void {
    this.hospitalService
      .getHospitals()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ hospitals }) => {
          this.hospitals = hospitals ?? [];
          this.filterDepartments();
        },
        error: () => {
          this.hospitals = [];
        }
      });
  }

  private watchHospitalSelection(): void {
    this.profileForm
      .get('hospitalIds')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.filterDepartments();
      });
  }

  private filterDepartments(): void {
    const selectedHospitalIds = this.profileForm.get('hospitalIds')?.value as string[];
    const allDepartments = this.hospitals.flatMap((hospital) =>
      (hospital.services ?? []).map((service) => ({
        ...service,
        hospitalId: service.hospitalId ?? hospital.id,
        hospitalName: hospital.name
      }))
    );

    if (!selectedHospitalIds || selectedHospitalIds.length === 0) {
      this.departments = allDepartments;
      return;
    }

    this.departments = allDepartments.filter((department) =>
      !!department.hospitalId && selectedHospitalIds.includes(department.hospitalId)
    );

    const currentDepartments = this.profileForm.get('departmentIds')?.value as string[];
    if (currentDepartments?.length) {
      const filtered = currentDepartments.filter((departmentId) =>
        this.departments.some((department) => department.id === departmentId)
      );
      if (filtered.length !== currentDepartments.length) {
        this.profileForm.get('departmentIds')?.setValue(filtered);
      }
    }
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

  getHospitalLabel(hospital: Hospital): string {
    return hospital.city ? `${hospital.name} (${hospital.city})` : hospital.name;
  }

  getDepartmentLabel(department: HospitalDepartment & { hospitalName?: string }): string {
    return department.hospitalName
      ? `${department.name} • ${department.hospitalName}`
      : department.name;
  }
}
