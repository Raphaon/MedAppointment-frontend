import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { DoctorProfile, HospitalSummary, MedicalSpecialty } from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule, MatButtonModule],
  templateUrl: './doctor-card.component.html',
  styleUrls: ['./doctor-card.component.scss']
})
export class DoctorCardComponent {
  @Input({ required: true }) doctor!: DoctorProfile;
  @Input() highlightKeyInfo = false;
  @Input() showAction = true;
  @Input() actionLabel = 'Prendre rendez-vous';
  @Input() actionColor: 'primary' | 'accent' | 'warn' = 'accent';
  @Input() showDetails = false;
  @Input() detailsLabel = 'Détails';
  @Input() detailsIcon = 'info';
  @Input() detailsColor: 'primary' | 'accent' | 'warn' | undefined;
  @Output() action = new EventEmitter<DoctorProfile>();
  @Output() details = new EventEmitter<DoctorProfile>();

  get specialtyLabel(): string {
    return getMedicalSpecialtyLabel(this.doctor.specialty as MedicalSpecialty);
  }

  get hasHospitals(): boolean {
    return (this.doctor.hospitals ?? []).length > 0;
  }

  get hospitalChips(): string[] {
    return (this.doctor.hospitals ?? []).map((hospital: HospitalSummary) =>
      hospital.city ? `${hospital.name} (${hospital.city})` : hospital.name
    );
  }

  onAction(): void {
    this.action.emit(this.doctor);
  }

  onDetails(): void {
    this.details.emit(this.doctor);
  }
}
