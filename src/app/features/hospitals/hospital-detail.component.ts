import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HospitalService } from '@app/core/services/hospital.service';
import { AuthService } from '@app/core/services/auth.service';
import { Hospital, HospitalDepartment, HospitalStaffMember, MedicalSpecialty, UserRole } from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

@Component({
  selector: 'app-hospital-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './hospital-detail.component.html',
  styleUrls: ['./hospital-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HospitalDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  hospital: Hospital | null = null;
  loading = false;
  canManage = false;
  hospitalId: string | null = null;
  readonly UserRole = UserRole;

  constructor(
    private readonly hospitalService: HospitalService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.canManage = user?.role === UserRole.ADMIN;
        this.cdr.markForCheck();
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.hospitalId = params.get('id');
        if (this.hospitalId) {
          this.loadHospital(this.hospitalId);
        }
        this.cdr.markForCheck();
      });
  }

  refresh(): void {
    if (this.hospitalId) {
      this.loadHospital(this.hospitalId);
    }
  }

  editHospital(): void {
    if (this.hospitalId) {
      this.router.navigate(['/hospitals', this.hospitalId, 'edit']);
    }
  }

  getDepartmentSpecialtyLabel(department: HospitalDepartment): string {
    return getMedicalSpecialtyLabel(department.specialty as MedicalSpecialty);
  }

  getStaffByRole(role: UserRole): HospitalStaffMember[] {
    if (!this.hospital) {
      return [];
    }

    const staffMembers = this.hospital.staff?.filter((member) => member.role === role) ?? [];

    if (role === UserRole.DOCTOR && staffMembers.length === 0 && this.hospital.doctors) {
      return this.hospital.doctors.map((doctor) => ({
        id: doctor.id,
        userId: doctor.userId,
        role: UserRole.DOCTOR,
        assignedDepartmentIds: doctor.departmentIds,
        user: doctor.user
      }));
    }

    return staffMembers;
  }

  getDepartmentStaff(department: HospitalDepartment, role: UserRole): HospitalStaffMember[] {
    if (!this.hospital) {
      return [];
    }

    const staffAssignments = this.hospital.staff?.filter((member) => {
      const assigned = member.assignedDepartmentIds ?? [];
      return member.role === role && assigned.includes(department.id);
    }) ?? [];

    if (role === UserRole.DOCTOR && staffAssignments.length === 0 && this.hospital.doctors) {
      return this.hospital.doctors
        .filter((doctor) => (doctor.departmentIds ?? []).includes(department.id))
        .map((doctor) => ({
          id: doctor.id,
          userId: doctor.userId,
          role: UserRole.DOCTOR,
          assignedDepartmentIds: doctor.departmentIds,
          user: doctor.user
        }));
    }

    return staffAssignments;
  }

  trackByDepartment(_: number, department: HospitalDepartment): string {
    return department.id;
  }

  trackByStaff(_: number, staff: HospitalStaffMember): string {
    return staff.id;
  }

  private loadHospital(id: string): void {
    this.loading = true;
    this.hospitalService
      .getHospitalById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ hospital }) => {
          this.hospital = hospital;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.hospital = null;
          this.snackBar.open('Hôpital introuvable ou inaccessible.', 'Fermer', { duration: 4000 });
          this.router.navigate(['/hospitals']);
          this.cdr.markForCheck();
        }
      });
  }
}
