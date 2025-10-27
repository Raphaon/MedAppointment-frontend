import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>
            <h1>🏥 MedAppointment</h1>
            <p>Créer un compte</p>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Prénom</mat-label>
              <input matInput formControlName="firstName" placeholder="Jean">
              <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                Le prénom est requis
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Nom</mat-label>
              <input matInput formControlName="lastName" placeholder="Dupont">
              <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">
                Le nom est requis
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="exemple@email.com">
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                L'email est requis
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Email invalide
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Téléphone (optionnel)</mat-label>
              <input matInput formControlName="phone" placeholder="+33612345678">
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Je suis un(e)</mat-label>
              <mat-select formControlName="role">
                <mat-option [value]="UserRole.PATIENT">Patient</mat-option>
                <mat-option [value]="UserRole.DOCTOR">Médecin</mat-option>
                <mat-option [value]="UserRole.NURSE">Infirmier / Infirmière</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Mot de passe</mat-label>
              <input matInput type="password" formControlName="password" placeholder="••••••••">
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Le mot de passe est requis
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Minimum 6 caractères
              </mat-error>
            </mat-form-field>

            <button 
              mat-raised-button 
              color="primary" 
              type="submit" 
              class="full-width"
              [disabled]="registerForm.invalid || loading">
              <span *ngIf="!loading">S'inscrire</span>
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            </button>
          </form>

          <div class="login-link">
            <p>Déjà un compte ? <a routerLink="/auth/login">Se connecter</a></p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .register-card {
      max-width: 450px;
      width: 100%;
      padding: 20px;
    }

    mat-card-title h1 {
      text-align: center;
      color: #667eea;
      margin: 0 0 10px 0;
    }

    mat-card-title p {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    mat-form-field {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    button mat-spinner {
      display: inline-block;
      margin: 0 auto;
    }

    .login-link {
      text-align: center;
      margin-top: 20px;
    }

    .login-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .login-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  UserRole = UserRole;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: [UserRole.PATIENT, Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.snackBar.open('Inscription réussie !', 'Fermer', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open(error.error?.error || 'Erreur lors de l\'inscription', 'Fermer', { duration: 5000 });
        }
      });
    }
  }
}
