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
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password/:token',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      }
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
    canActivate: [AuthGuard],
    data: { roles: [UserRole.DOCTOR] }
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
      },
      {
        path: ':id',
        loadComponent: () => import('./features/appointments/appointment-detail.component').then(m => m.AppointmentDetailComponent)
      }
    ]
  },
  {
    path: 'doctors',
    loadComponent: () => import('./features/doctors/doctors-list.component').then(m => m.DoctorsListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'doctors/search',
    loadComponent: () => import('./features/search/search-doctors.component').then(m => m.SearchDoctorsComponent),
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
      },
      {
        path: 'edit-nurse',
        loadComponent: () => import('./features/profile/nurse-profile-form.component').then(m => m.NurseProfileFormComponent),
        data: { roles: [UserRole.NURSE] }
      }
    ]
  },
  {
    path: 'hospitals',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/hospitals/hospital-list.component').then(m => m.HospitalListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/hospitals/hospital-form.component').then(m => m.HospitalFormComponent),
        data: { roles: [UserRole.ADMIN] }
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/hospitals/hospital-form.component').then(m => m.HospitalFormComponent),
        data: { roles: [UserRole.ADMIN] }
      },
      {
        path: ':id',
        loadComponent: () => import('./features/hospitals/hospital-detail.component').then(m => m.HospitalDetailComponent)
      }
    ]
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
    canActivate: [AuthGuard],
    data: { roles: [UserRole.ADMIN] }
  },
  { path: '**', redirectTo: '/dashboard' }
];
