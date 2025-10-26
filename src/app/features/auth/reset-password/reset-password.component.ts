import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>
            <h1>🔄 Réinitialisation du mot de passe</h1>
            <p>Définissez un nouveau mot de passe sécurisé</p>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content *ngIf="token; else invalidToken">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Nouveau mot de passe</mat-label>
              <input matInput type="password" formControlName="password" placeholder="••••••••">
              <mat-error *ngIf="form.get('password')?.hasError('required')">
                Le mot de passe est requis
              </mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">
                Minimum 8 caractères
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Confirmer le mot de passe</mat-label>
              <input matInput type="password" formControlName="confirmPassword" placeholder="••••••••">
              <mat-error *ngIf="form.get('confirmPassword')?.hasError('required')">
                La confirmation est requise
              </mat-error>
              <mat-error *ngIf="form.hasError('passwordMismatch')">
                Les mots de passe ne correspondent pas
              </mat-error>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="form.invalid || loading">
              <span *ngIf="!loading">Réinitialiser</span>
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            </button>
          </form>

          <div class="link">
            <a routerLink="/auth/login">Retour à la connexion</a>
          </div>
        </mat-card-content>

        <ng-template #invalidToken>
          <div class="invalid-token">
            <p>Jeton de réinitialisation invalide.</p>
            <a routerLink="/auth/forgot-password">Demander un nouveau lien</a>
          </div>
        </ng-template>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .auth-card {
      max-width: 420px;
      width: 100%;
      padding: 20px;
    }

    mat-card-title {
      text-align: center;
    }

    mat-card-title h1 {
      margin: 0 0 12px;
      color: #667eea;
    }

    mat-card-title p {
      margin: 0;
      color: #666;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 16px;
    }

    .link {
      margin-top: 16px;
      text-align: center;
    }

    .link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .link a:hover {
      text-decoration: underline;
    }

    .invalid-token {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .invalid-token a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token: string | null = null;
  loading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator.bind(this) });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
  }

  submit(): void {
    if (!this.token || this.form.invalid) {
      return;
    }

    this.loading = true;
    const password = this.form.value.password;

    this.authService.resetPassword(this.token, password).subscribe({
      next: (response) => {
        this.loading = false;
        const message = response.message || 'Mot de passe réinitialisé avec succès';
        this.snackBar.open(message, 'Fermer', { duration: 4000 });
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.error?.error || 'Impossible de réinitialiser le mot de passe', 'Fermer', { duration: 5000 });
      }
    });
  }

  private passwordMatchValidator(group: FormGroup): null | { passwordMismatch: boolean } {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }
}
