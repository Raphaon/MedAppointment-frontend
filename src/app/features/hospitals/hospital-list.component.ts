import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HospitalService } from '@app/core/services/hospital.service';
import { AuthService } from '@app/core/services/auth.service';
import { Hospital, UserRole } from '@app/core/models';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-hospital-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ConfirmDialogComponent
  ],
  templateUrl: './hospital-list.component.html',
  styleUrls: ['./hospital-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HospitalListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  displayedColumns = ['name', 'services', 'staff', 'actions'];
  hospitals: Hospital[] = [];
  loading = false;
  canManage = false;

  constructor(
    private readonly hospitalService: HospitalService,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.canManage = user?.role === UserRole.ADMIN;
        this.cdr.markForCheck();
      });

    this.loadHospitals();
  }

  trackByHospital(_: number, hospital: Hospital): string {
    return hospital.id;
  }

  getServiceCount(hospital: Hospital): number {
    return hospital.services?.length ?? 0;
  }

  getDoctorCount(hospital: Hospital): number {
    const staffDoctors = hospital.staff?.filter((member) => member.role === UserRole.DOCTOR).length ?? 0;
    return Math.max(staffDoctors, hospital.doctors?.length ?? staffDoctors);
  }

  getNurseCount(hospital: Hospital): number {
    return hospital.staff?.filter((member) => member.role === UserRole.NURSE).length ?? 0;
  }

  viewHospital(hospital: Hospital): void {
    this.router.navigate(['/hospitals', hospital.id]);
  }

  editHospital(hospital: Hospital): void {
    this.router.navigate(['/hospitals', hospital.id, 'edit']);
  }

  createHospital(): void {
    this.router.navigate(['/hospitals/create']);
  }

  deleteHospital(hospital: Hospital): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Supprimer un hôpital',
          message: `Confirmez-vous la suppression de ${hospital.name} ?`,
          confirmLabel: 'Supprimer',
          icon: 'delete'
        },
        autoFocus: false,
        restoreFocus: false
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.hospitalService
          .deleteHospital(hospital.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Hôpital supprimé avec succès', 'Fermer', { duration: 3000 });
              this.loadHospitals();
            },
            error: () => {
              this.snackBar.open('Impossible de supprimer cet hôpital pour le moment', 'Fermer', { duration: 4000 });
              this.cdr.markForCheck();
            }
          });
      });
  }

  refresh(): void {
    this.loadHospitals();
  }

  private loadHospitals(): void {
    this.loading = true;
    this.hospitalService
      .getHospitals()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ hospitals }) => {
          this.hospitals = hospitals ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loading = false;
          this.hospitals = [];
          const message = error?.error?.message || 'Erreur lors du chargement des hôpitaux';
          this.snackBar.open(message, 'Fermer', { duration: 4000 });
          this.cdr.markForCheck();
        }
      });
  }
}
