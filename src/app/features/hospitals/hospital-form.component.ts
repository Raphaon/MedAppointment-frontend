import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HospitalService } from '@app/core/services/hospital.service';
import { DoctorService } from '@app/core/services/doctor.service';
import { UserService } from '@app/core/services/user.service';
import {
  CreateHospitalDto,
  DoctorProfile,
  Hospital,
  HospitalDepartment,
  MedicalSpecialty,
  UpsertHospitalDepartmentDto,
  User,
  UserRole
} from '@app/core/models';
import { MEDICAL_SPECIALTY_OPTIONS, getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

@Component({
  selector: 'app-hospital-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './hospital-form.component.html',
  styleUrls: ['./hospital-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HospitalFormComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  hospitalForm: FormGroup;
  loading = false;
  saving = false;
  isEditing = false;
  hospitalId: string | null = null;

  doctors: DoctorProfile[] = [];
  nurses: User[] = [];
  specialties = MEDICAL_SPECIALTY_OPTIONS;

  constructor(
    private readonly fb: FormBuilder,
    private readonly hospitalService: HospitalService,
    private readonly doctorService: DoctorService,
    private readonly userService: UserService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {
    this.hospitalForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      address: ['', Validators.required],
      city: [''],
      country: [''],
      phone: [''],
      email: ['', Validators.email],
      services: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.hospitalId = params.get('id');
        if (this.hospitalId) {
          this.loadHospital(this.hospitalId);
        } else {
          this.isEditing = false;
        }
        this.cdr.markForCheck();
      });

    this.loadDoctors();
    this.loadNurses();
  }

  get services(): FormArray<FormGroup> {
    return this.hospitalForm.get('services') as FormArray<FormGroup>;
  }

  addService(service?: HospitalDepartment): void {
    this.services.push(
      this.fb.group({
        id: [service?.id ?? null],
        name: [service?.name ?? '', Validators.required],
        description: [service?.description ?? ''],
        specialty: [service?.specialty ?? null],
        doctorIds: [service?.doctorIds ?? []],
        nurseIds: [service?.nurseIds ?? []]
      })
    );
  }

  removeService(index: number): void {
    this.services.removeAt(index);
  }

  getDoctorLabel(doctor: DoctorProfile): string {
    const name = `Dr. ${doctor.user?.firstName ?? ''} ${doctor.user?.lastName ?? ''}`.trim();
    return `${name} – ${getMedicalSpecialtyLabel(doctor.specialty as MedicalSpecialty)}`;
  }

  getNurseLabel(nurse: User): string {
    return `${nurse.firstName} ${nurse.lastName}`;
  }

  submit(): void {
    if (this.hospitalForm.invalid) {
      this.snackBar.open('Veuillez corriger les erreurs du formulaire.', 'Fermer', { duration: 3000 });
      return;
    }

    this.saving = true;

    const formValue = this.hospitalForm.value as CreateHospitalDto & { services: UpsertHospitalDepartmentDto[] };
    const payload: CreateHospitalDto = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
      address: formValue.address.trim(),
      city: formValue.city?.trim() || undefined,
      country: formValue.country?.trim() || undefined,
      phone: formValue.phone?.trim() || undefined,
      email: formValue.email?.trim() || undefined,
      services: formValue.services?.map((service) => ({
        id: service.id ?? undefined,
        name: service.name.trim(),
        description: service.description?.trim() || undefined,
        specialty: service.specialty ?? null,
        doctorIds: service.doctorIds ?? [],
        nurseIds: service.nurseIds ?? []
      })) ?? []
    };

    const request$ = this.isEditing && this.hospitalId
      ? this.hospitalService.updateHospital(this.hospitalId, payload)
      : this.hospitalService.createHospital(payload);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ hospital }) => {
          this.saving = false;
          this.snackBar.open(`Hôpital ${this.isEditing ? 'mis à jour' : 'créé'} avec succès`, 'Fermer', { duration: 3000 });
          this.router.navigate(['/hospitals', hospital.id]);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.saving = false;
          const message = error?.error?.message || 'Impossible d\'enregistrer cet hôpital.';
          this.snackBar.open(message, 'Fermer', { duration: 4000 });
          this.cdr.markForCheck();
        }
      });
  }

  trackByService(_: number, serviceGroup: FormGroup): string {
    return serviceGroup.get('id')?.value ?? serviceGroup.get('name')?.value;
  }

  get isReadOnly(): boolean {
    return false;
  }

  private loadHospital(id: string): void {
    this.loading = true;
    this.hospitalService
      .getHospitalById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ hospital }) => {
          this.loading = false;
          this.isEditing = true;
          this.populateForm(hospital);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Hôpital introuvable', 'Fermer', { duration: 3000 });
          this.router.navigate(['/hospitals']);
          this.cdr.markForCheck();
        }
      });
  }

  private populateForm(hospital: Hospital): void {
    this.hospitalForm.patchValue({
      name: hospital.name,
      description: hospital.description ?? '',
      address: hospital.address,
      city: hospital.city ?? '',
      country: hospital.country ?? '',
      phone: hospital.phone ?? '',
      email: hospital.email ?? ''
    });

    this.services.clear();
    (hospital.services ?? []).forEach((service) => this.addService(service));
  }

  private loadDoctors(): void {
    this.doctorService
      .getAllDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ doctors }) => {
          this.doctors = doctors ?? [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.doctors = [];
          this.cdr.markForCheck();
        }
      });
  }

  private loadNurses(): void {
    this.userService
      .getAllUsers(UserRole.NURSE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users }) => {
          this.nurses = users ?? [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.nurses = [];
          this.cdr.markForCheck();
        }
      });
  }
}
