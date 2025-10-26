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
      [UserRole.PATIENT]: 'Patient'
    };
    return labels[this.currentUser?.role || ''] || 'Utilisateur';
  }

  getRoleColor(): string {
    const colors: any = {
      [UserRole.ADMIN]: 'warn',
      [UserRole.DOCTOR]: 'primary',
      [UserRole.PATIENT]: 'accent'
    };
    return colors[this.currentUser?.role || ''] || '';
  }

  getAvatarIcon(): string {
    const icons: any = {
      [UserRole.ADMIN]: 'admin_panel_settings',
      [UserRole.DOCTOR]: 'local_hospital',
      [UserRole.PATIENT]: 'person'
    };
    return icons[this.currentUser?.role || ''] || 'person';
  }

  getSpecialtyLabel(specialty: MedicalSpecialty): string {
    return getMedicalSpecialtyLabel(specialty);
  }
}
