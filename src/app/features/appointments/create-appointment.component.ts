import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService } from '@app/core/services/appointment.service';
import { DoctorService } from '@app/core/services/doctor.service';
import { AuthService } from '@app/core/services/auth.service';
import { DoctorProfile, MedicalSpecialty } from '@app/core/models';
import { getMedicalSpecialtyLabel } from '@app/shared/constants/medical.constants';

@Component({
  selector: 'app-create-appointment',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './create-appointment.component.html',
  styleUrls: ['./create-appointment.component.scss']
})
export class CreateAppointmentComponent implements OnInit {
  appointmentForm: FormGroup;
  loading = false;
  doctors: DoctorProfile[] = [];
  selectedDoctor: DoctorProfile | null = null;
  minDate = new Date();
  hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h à 19h

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.appointmentForm = this.fb.group({
      doctorId: ['', Validators.required],
      appointmentDate: ['', Validators.required],
      hour: ['09', Validators.required],
      minute: ['00', Validators.required],
      duration: [30, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadDoctors();

    // Pré-sélectionner un médecin si passé en paramètre
    this.route.queryParams.subscribe((params: any) => {
      if (params['doctorId']) {
        this.appointmentForm.patchValue({ doctorId: params['doctorId'] });
      }
    });
  }

  loadDoctors(): void {
    this.doctorService.getAllDoctors().subscribe({
      next: (response: any) => {
        this.doctors = response.doctors;
        
        // Si un doctorId est pré-sélectionné, charger ses infos
        const preselectedDoctorId = this.appointmentForm.get('doctorId')?.value;
        if (preselectedDoctorId) {
          this.selectedDoctor = this.doctors.find((d: any) => d.userId === preselectedDoctorId) || null;
        }
      },
      error: (error: any) => {
        this.snackBar.open('Erreur lors du chargement des médecins', 'Fermer', { duration: 3000 });
      }
    });
  }

  onDoctorChange(event: any): void {
    this.selectedDoctor = this.doctors.find((d: any) => d.userId === event.value) || null;
  }

  getSpecialtyLabel(specialty: MedicalSpecialty): string {
    return getMedicalSpecialtyLabel(specialty);
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      this.loading = true;

      const formValue = this.appointmentForm.value;
      const currentUser = this.authService.getCurrentUser();

      if (!currentUser) {
        this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 3000 });
        this.loading = false;
        return;
      }

      // Construire la date complète
      const date = new Date(formValue.appointmentDate);
      date.setHours(parseInt(formValue.hour), parseInt(formValue.minute), 0, 0);

      const appointmentData = {
        doctorId: formValue.doctorId,
        patientId: currentUser.id,
        appointmentDate: date.toISOString(),
        duration: formValue.duration,
        reason: formValue.reason,
        notes: formValue.notes || undefined
      };

      this.appointmentService.createAppointment(appointmentData).subscribe({
        next: () => {
          this.snackBar.open('✅ Rendez-vous créé avec succès !', 'Fermer', { duration: 5000 });
          this.router.navigate(['/appointments']);
        },
        error: (error: any) => {
          this.loading = false;
          const errorMsg = error.error?.error || 'Erreur lors de la création du rendez-vous';
          this.snackBar.open(errorMsg, 'Fermer', { duration: 5000 });
        }
      });
    }
  }
}
