import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';

import { User, UserRole } from '@app/core/models';
import { UsersState } from './users.state';
import { UserService } from '@app/core/services/user.service';
import { StatCardComponent } from '@app/shared/components/stat-card/stat-card.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@app/shared/components/confirm-dialog/confirm-dialog.component';

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
    MatDialogModule,
    StatCardComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  users: User[] = [];
  selectedRole: UserRole | null = null;
  readonly displayedColumns: string[] = ['name', 'phone', 'role', 'status', 'createdAt', 'actions'];
  readonly UserRole = UserRole;

  constructor(
    private readonly usersState: UsersState,
    private readonly userService: UserService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.usersState.users$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
        this.users = users;
      });

    this.usersState.errors$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        this.snackBar.open(message, 'Fermer', { duration: 4000 });
      });
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrateur';
      case UserRole.DOCTOR:
        return 'Médecin';
      case UserRole.NURSE:
        return 'Infirmier(ère)';
      case UserRole.PATIENT:
        return 'Patient';
      default:
        return 'Utilisateur';
    }
  }

  getRoleIcon(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'security';
      case UserRole.DOCTOR:
        return 'local_hospital';
      case UserRole.NURSE:
        return 'vaccines';
      case UserRole.PATIENT:
        return 'person';
      default:
        return 'account_circle';
    }
  }

  getRoleColor(role: UserRole): 'primary' | 'accent' | 'warn' | undefined {
    switch (role) {
      case UserRole.ADMIN:
        return 'warn';
      case UserRole.DOCTOR:
        return 'accent';
      case UserRole.NURSE:
        return 'primary';
      case UserRole.PATIENT:
        return 'accent';
      default:
        return undefined;
    }
  }

  onFilterChange(): void {
    this.usersState.setRole(this.selectedRole);
    this.usersState.refresh();
  }

  toggleStatus(user: User): void {
    this.openConfirmationDialog({
      title: user.isActive ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur',
      message: `Voulez-vous vraiment ${user.isActive ? 'désactiver' : 'activer'} ${user.firstName} ${user.lastName} ?`,
      confirmLabel: user.isActive ? 'Désactiver' : 'Activer',
      icon: user.isActive ? 'block' : 'check_circle'
    })
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.userService.toggleUserStatus(user.id).subscribe({
          next: () => {
            this.snackBar.open('Statut mis à jour', 'Fermer', { duration: 3000 });
            this.usersState.refresh();
          },
          error: () => {
            this.snackBar.open('Erreur lors de la mise à jour du statut', 'Fermer', { duration: 3000 });
          }
        });
      });
  }

  deleteUser(user: User): void {
    this.openConfirmationDialog({
      title: 'Supprimer un utilisateur',
      message: `Voulez-vous vraiment supprimer ${user.firstName} ${user.lastName} ?`,
      confirmLabel: 'Supprimer',
      icon: 'delete'
    })
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.snackBar.open('Utilisateur supprimé', 'Fermer', { duration: 3000 });
            this.usersState.refresh();
          },
          error: () => {
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
          }
        });
      });
  }

  private openConfirmationDialog(data: ConfirmDialogData) {
    return this.dialog.open(ConfirmDialogComponent, {
      data,
      autoFocus: false,
      restoreFocus: false
    }).afterClosed();
  }
}
