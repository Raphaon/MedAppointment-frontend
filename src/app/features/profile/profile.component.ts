import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '@app/core/services/auth.service';
import { User, UserRole, MedicalSpecialty } from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']

})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  UserRole = UserRole;


  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });
  }

  getRoleLabel(): string {
    const labels: any = {
      [UserRole.ADMIN]: 'Administrateur',
      [UserRole.DOCTOR]: 'Médecin',
      [UserRole.PATIENT]: 'Patient',
      [UserRole.NURSE]: 'Infirmier(ère)'
    };
    return labels[this.currentUser?.role || ''] || 'Utilisateur';
  }

  getRoleColor(): string {
    const colors: any = {
      [UserRole.ADMIN]: 'warn',
      [UserRole.DOCTOR]: 'primary',
      [UserRole.PATIENT]: 'accent',
      [UserRole.NURSE]: 'primary'
    };
    return colors[this.currentUser?.role || ''] || '';
  }

  getAvatarIcon(): string {
    const icons: any = {
      [UserRole.ADMIN]: 'admin_panel_settings',
      [UserRole.DOCTOR]: 'local_hospital',
      [UserRole.PATIENT]: 'person',
      [UserRole.NURSE]: 'vaccines'
    };
    return icons[this.currentUser?.role || ''] || 'person';
  }

  getSpecialtyLabel(specialty: MedicalSpecialty): string {
    return getMedicalSpecialtyLabel(specialty);
  }

  getHospitalLabel(): string {
    if (!this.currentUser?.nurseProfile?.hospitals?.length && !this.currentUser?.doctorProfile?.hospitals?.length) {
      return 'Non affecté';
    }

    const hospitals = this.currentUser?.nurseProfile?.hospitals ?? this.currentUser?.doctorProfile?.hospitals ?? [];
    return hospitals.map((hospital) => hospital.city ? `${hospital.name} (${hospital.city})` : hospital.name).join(', ');
  }
}
