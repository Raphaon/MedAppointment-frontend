import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
            <h1>🔐 Mot de passe oublié</h1>
            <p>Recevez un lien de réinitialisation par email</p>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="exemple@email.com">
              <mat-error *ngIf="form.get('email')?.hasError('required')">
                L'email est requis
              </mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">
                Email invalide
              </mat-error>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="form.invalid || loading">
              <span *ngIf="!loading">Envoyer le lien</span>
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            </button>
          </form>

          <div class="link">
            <a routerLink="/auth/login">Retour à la connexion</a>
          </div>
        </mat-card-content>
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
  `]
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const email = this.form.value.email;
    this.authService.requestPasswordReset(email).subscribe({
      next: (response) => {
        this.loading = false;
        const message = response.message || 'Email de réinitialisation envoyé';
        this.snackBar.open(message, 'Fermer', { duration: 4000 });
        this.form.reset();
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.error?.error || 'Impossible d\'envoyer le lien', 'Fermer', { duration: 5000 });
      }
    });
  }
}
