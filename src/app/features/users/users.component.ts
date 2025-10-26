import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { UserService } from '@app/core/services/user.service';
import { User, UserRole } from '@app/core/models';
import { StatCardComponent } from '@app/shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTooltipModule,
    StatCardComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']

})
export class UsersComponent implements OnInit {
  users: User[] = [];
  selectedRole: UserRole | null = null;
  displayedColumns: string[] = ['name', 'phone', 'role', 'status', 'createdAt', 'actions'];
  UserRole = UserRole;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAllUsers(this.selectedRole || undefined).subscribe({
      next: (response: any) => {
        this.users = response.users;
      },
      error: (error: any) => {
        this.snackBar.open('Erreur lors du chargement des utilisateurs', 'Fermer', { duration: 3000 });
      }
    });
  }

  onFilterChange(): void {
    this.loadUsers();
  }

  getRoleLabel(role: UserRole): string {
    const labels: any = {
      [UserRole.ADMIN]: 'Administrateur',
      [UserRole.DOCTOR]: 'Médecin',
      [UserRole.PATIENT]: 'Patient'
    };
    return labels[role] || role;
  }

  getRoleColor(role: UserRole): string {
    const colors: any = {
      [UserRole.ADMIN]: 'warn',
      [UserRole.DOCTOR]: 'primary',
      [UserRole.PATIENT]: 'accent'
    };
    return colors[role] || '';
  }

  getRoleIcon(role: UserRole): string {
    const icons: any = {
      [UserRole.ADMIN]: 'admin_panel_settings',
      [UserRole.DOCTOR]: 'local_hospital',
      [UserRole.PATIENT]: 'person'
    };
    return icons[role] || 'person';
  }

  toggleStatus(user: User): void {
    const action = user.isActive ? 'désactiver' : 'activer';
    if (confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) {
      this.userService.toggleUserStatus(user.id).subscribe({
        next: () => {
          this.snackBar.open(`Utilisateur ${action === 'désactiver' ? 'désactivé' : 'activé'}`, 'Fermer', { duration: 3000 });
          this.loadUsers();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Voulez-vous vraiment supprimer ${user.firstName} ${user.lastName} ?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('Utilisateur supprimé', 'Fermer', { duration: 3000 });
          this.loadUsers();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }
}
