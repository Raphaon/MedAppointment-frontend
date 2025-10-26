import { Component, DestroyRef, inject } from '@angular/core';
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
import { User, UserRole } from '@app/core/models';
import { UsersState } from './users.state';
import { UserService } from '@app/core/services/user.service';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    MatTooltipModule
  ],
  template: `
    <div class="users-container">
      <div class="header">
        <h1>👥 Gestion des Utilisateurs</h1>
        <button mat-raised-button color="primary" routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Retour
        </button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Filtrer par rôle</mat-label>
          <mat-select [ngModel]="selectedRole$ | async" (ngModelChange)="onFilterChange($event)">
            <mat-option [value]="null">Tous les rôles</mat-option>
            <mat-option [value]="UserRole.ADMIN">Administrateurs</mat-option>
            <mat-option [value]="UserRole.DOCTOR">Médecins</mat-option>
            <mat-option [value]="UserRole.PATIENT">Patients</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="stats">
          <div class="stat-card">
            <mat-icon>people</mat-icon>
            <div>
              <strong>{{ (users$ | async)?.length ?? 0 }}</strong>
              <span>Utilisateurs</span>
            </div>
          </div>
        </div>
      </div>

      <ng-container *ngIf="users$ | async as users">
        <div class="table-container" *ngIf="users.length > 0; else noUsers">
          <table mat-table [dataSource]="users" class="mat-elevation-z2">
          
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let user">
              <div class="user-cell">
                <mat-icon class="user-avatar">{{ getRoleIcon(user.role) }}</mat-icon>
                <div>
                  <strong>{{ user.firstName }} {{ user.lastName }}</strong>
                  <br>
                  <small>{{ user.email }}</small>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Téléphone</th>
            <td mat-cell *matCellDef="let user">
              {{ user.phone || 'Non renseigné' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rôle</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip [color]="getRoleColor(user.role)" selected>
                {{ getRoleLabel(user.role) }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip [color]="user.isActive ? 'primary' : ''" [selected]="user.isActive">
                {{ user.isActive ? 'Actif' : 'Inactif' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Inscription</th>
            <td mat-cell *matCellDef="let user">
              {{ user.createdAt | date:'dd/MM/yyyy' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button 
                      [color]="user.isActive ? 'warn' : 'primary'"
                      (click)="toggleStatus(user)"
                      [matTooltip]="user.isActive ? 'Désactiver' : 'Activer'">
                <mat-icon>{{ user.isActive ? 'block' : 'check_circle' }}</mat-icon>
              </button>
              
              <button mat-icon-button color="warn" 
                      (click)="deleteUser(user)"
                      matTooltip="Supprimer"
                      *ngIf="user.role !== UserRole.ADMIN">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
      </ng-container>

      <ng-template #noUsers>
        <div class="no-data">
          <mat-icon>people_outline</mat-icon>
          <p>Aucun utilisateur trouvé</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
      background-color: #f5f5f5;
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .filters {
      display: flex;
      gap: 24px;
      align-items: center;
      margin-bottom: 24px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .filters mat-form-field {
      width: 300px;
    }

    .stats {
      display: flex;
      gap: 16px;
      flex: 1;
      justify-content: flex-end;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
    }

    .stat-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .stat-card strong {
      display: block;
      font-size: 24px;
    }

    .stat-card span {
      font-size: 12px;
      opacity: 0.9;
    }

    .table-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    table {
      width: 100%;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .user-cell strong {
      display: block;
      color: #333;
    }

    .user-cell small {
      color: #666;
      font-size: 12px;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
    }

    .no-data mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #ccc;
    }

    .no-data p {
      color: #666;
      font-size: 18px;
      margin-top: 16px;
    }
  `]
})
export class UsersComponent {
  private readonly destroyRef = inject(DestroyRef);
  users$: Observable<User[]> = this.usersState.users$;
  selectedRole$ = this.usersState.selectedRole$;
  displayedColumns: string[] = ['name', 'phone', 'role', 'status', 'createdAt', 'actions'];
  UserRole = UserRole;

  constructor(
    private userService: UserService,
    private usersState: UsersState,
    private snackBar: MatSnackBar
  ) {
    this.usersState.errors$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        this.snackBar.open(message, 'Fermer', { duration: 3000 });
      });
  }

  onFilterChange(role: UserRole | null): void {
    this.usersState.setRole(role);
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
      this.userService.toggleUserStatus(user.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackBar.open(`Utilisateur ${action === 'désactiver' ? 'désactivé' : 'activé'}`, 'Fermer', { duration: 3000 });
            this.usersState.refresh();
          },
          error: () => {
            this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
          }
        });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Voulez-vous vraiment supprimer ${user.firstName} ${user.lastName} ?`)) {
      this.userService.deleteUser(user.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackBar.open('Utilisateur supprimé', 'Fermer', { duration: 3000 });
            this.usersState.refresh();
          },
          error: () => {
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
          }
        });
    }
  }
}
