import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { UserRole } from './core/models';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'appointments',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/appointments/appointments.component').then(m => m.AppointmentsComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/appointments/create-appointment.component').then(m => m.CreateAppointmentComponent)
      }
    ]
  },
  {
    path: 'doctors',
    loadComponent: () => import('./features/doctors/doctors-list.component').then(m => m.DoctorsListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'edit-doctor',
        loadComponent: () => import('./features/profile/doctor-profile-form.component').then(m => m.DoctorProfileFormComponent),
        data: { roles: [UserRole.DOCTOR] }
      },
      {
        path: 'edit-patient',
        loadComponent: () => import('./features/profile/patient-profile-form.component').then(m => m.PatientProfileFormComponent),
        data: { roles: [UserRole.PATIENT] }
      }
    ]
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
    canActivate: [AuthGuard],
    data: { roles: [UserRole.ADMIN] }
  },
  {
    path: 'consultations',
    canActivate: [AuthGuard],
    data: { roles: [UserRole.DOCTOR] },
    children: [
      {
        path: '',
        loadComponent: () => import('./features/consultations/consultations.component').then(m => m.ConsultationsComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/consultations/consultation-room.component').then(m => m.ConsultationRoomComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
