import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

export interface DoctorDetailDialogData {
  doctor: DoctorProfile;
}

@Component({
  selector: 'app-doctor-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './doctor-detail-dialog.component.html',
  styleUrls: ['./doctor-detail-dialog.component.scss']
})
export class DoctorDetailDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<DoctorDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DoctorDetailDialogData
  ) {}

  get doctor(): DoctorProfile {
    return this.data.doctor;
  }

  get hasAvailabilityWindow(): boolean {
    return !!(this.doctor.availableFrom && this.doctor.availableTo);
  }

  getSpecialtyLabel(specialty: MedicalSpecialty): string {
    return getMedicalSpecialtyLabel(specialty);
  }

  close(): void {
    this.dialogRef.close();
  }
}
