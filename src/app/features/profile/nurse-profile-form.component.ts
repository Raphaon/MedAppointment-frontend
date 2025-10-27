import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NurseService } from '@app/core/services/nurse.service';
import { HospitalService } from '@app/core/services/hospital.service';
import { Hospital, HospitalDepartment } from '@app/core/models';

type DepartmentOption = HospitalDepartment & { hospitalId?: string; hospitalName?: string };

@Component({
  selector: 'app-nurse-profile-form',
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
  templateUrl: './nurse-profile-form.component.html',
  styleUrls: ['./nurse-profile-form.component.scss']
})
export class NurseProfileFormComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  profileForm: FormGroup;
  loading = false;
  isEditing = false;

  hospitals: Hospital[] = [];
  private allDepartments: DepartmentOption[] = [];
  filteredDepartments: DepartmentOption[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly nurseService: NurseService,
    private readonly hospitalService: HospitalService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      licenseNumber: ['', Validators.required],
      yearsExperience: [0, [Validators.min(0)]],
      primaryDepartment: [''],
      skills: [''],
      bio: [''],
      hospitalIds: [[]],
      departmentIds: [[]]
    });
  }

  get selectedHospitalIds(): string[] {
    return (this.profileForm.get('hospitalIds')?.value as string[]) ?? [];
  }

  get selectedDepartmentIds(): string[] {
    return (this.profileForm.get('departmentIds')?.value as string[]) ?? [];
  }

  get hasHospitalSelection(): boolean {
    return this.selectedHospitalIds.length > 0;
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadHospitals();
    this.watchHospitalSelection();
  }

  loadProfile(): void {
    this.nurseService
      .getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ profile }) => {
          this.isEditing = true;
          this.profileForm.patchValue({
            licenseNumber: profile.licenseNumber,
            yearsExperience: profile.yearsExperience ?? 0,
            primaryDepartment: profile.primaryDepartment ?? '',
            skills: profile.skills ?? '',
            bio: profile.bio ?? '',
            hospitalIds: profile.hospitalIds ?? profile.hospitals?.map((hospital) => hospital.id) ?? [],
            departmentIds: profile.departmentIds ?? profile.departments?.map((department) => department.id) ?? []
          });
          this.filterDepartments();
        },
        error: () => {
          this.isEditing = false;
        }
      });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.snackBar.open('Veuillez vérifier les informations saisies.', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading = true;

    const formValue = this.profileForm.value;
    const yearsExperience = Number(formValue.yearsExperience ?? 0);
    const payload = {
      licenseNumber: formValue.licenseNumber?.trim() ?? '',
      yearsExperience: Number.isFinite(yearsExperience) ? yearsExperience : 0,
      primaryDepartment: formValue.primaryDepartment?.trim() || undefined,
      skills: formValue.skills?.trim() || undefined,
      bio: formValue.bio?.trim() || undefined,
      hospitalIds: Array.from(new Set(this.selectedHospitalIds)),
      departmentIds: Array.from(new Set(this.selectedDepartmentIds))
    };

    const request$ = this.isEditing
      ? this.nurseService.updateProfile(payload)
      : this.nurseService.createProfile(payload);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open(
            `Profil infirmier ${this.isEditing ? 'mis à jour' : 'créé'} avec succès`,
            'Fermer',
            { duration: 3000 }
          );
          this.router.navigate(['/profile']);
        },
        error: (error) => {
          this.loading = false;
          const message = error?.error?.message || 'Une erreur est survenue lors de l\'enregistrement.';
          this.snackBar.open(message, 'Fermer', { duration: 4000 });
        }
      });
  }

  getHospitalLabel(hospital: Hospital): string {
    return hospital.city ? `${hospital.name} (${hospital.city})` : hospital.name;
  }

  getDepartmentLabel(department: DepartmentOption): string {
    return department.hospitalName
      ? `${department.name} • ${department.hospitalName}`
      : department.name;
  }

  private loadHospitals(): void {
    this.hospitalService
      .getHospitals()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ hospitals }) => {
          this.hospitals = hospitals ?? [];
          this.buildDepartments();
          this.filterDepartments();
        },
        error: () => {
          this.hospitals = [];
          this.allDepartments = [];
          this.filteredDepartments = [];
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

  private buildDepartments(): void {
    this.allDepartments = this.hospitals.flatMap((hospital) =>
      (hospital.services ?? []).map((service) => ({
        ...service,
        hospitalId: service.hospitalId ?? hospital.id,
        hospitalName: hospital.name
      }))
    );
  }

  private filterDepartments(): void {
    const selectedHospitalIds = this.selectedHospitalIds;

    if (selectedHospitalIds.length === 0) {
      this.filteredDepartments = [...this.allDepartments];
    } else {
      this.filteredDepartments = this.allDepartments.filter((department) =>
        !!department.hospitalId && selectedHospitalIds.includes(department.hospitalId)
      );
    }

    const departmentControl = this.profileForm.get('departmentIds');
    const currentSelection = (departmentControl?.value as string[]) ?? [];
    const allowedIds = new Set(this.filteredDepartments.map((department) => department.id));
    const filteredSelection = currentSelection.filter((id) => allowedIds.has(id));

    if (filteredSelection.length !== currentSelection.length) {
      departmentControl?.setValue(filteredSelection);
    }
  }
}
