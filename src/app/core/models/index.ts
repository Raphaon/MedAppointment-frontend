// Énumérations
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT'
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

export enum MedicalSpecialty {
  GENERAL_PRACTICE = 'GENERAL_PRACTICE',
  CARDIOLOGY = 'CARDIOLOGY',
  DERMATOLOGY = 'DERMATOLOGY',
  PEDIATRICS = 'PEDIATRICS',
  GYNECOLOGY = 'GYNECOLOGY',
  ORTHOPEDICS = 'ORTHOPEDICS',
  PSYCHIATRY = 'PSYCHIATRY',
  OPHTHALMOLOGY = 'OPHTHALMOLOGY',
  ENT = 'ENT',
  NEUROLOGY = 'NEUROLOGY',
  OTHER = 'OTHER'
}

// Interfaces
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  doctorProfile?: DoctorProfile;
  patientProfile?: PatientProfile;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  specialty: MedicalSpecialty;
  yearsExperience: number;
  bio?: string;
  consultationFee?: number;
  availableFrom?: string;
  availableTo?: string;
  user?: User;
}

export interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContact?: string;
  user?: User;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentDate: string;
  duration: number;
  reason: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  doctor?: User;
  patient?: User;
}

export enum ConsultationStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Consultation {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  status: ConsultationStatus;
  startTime?: string;
  endTime?: string;
  summary?: string;
  prescriptionUrl?: string;
  diagnostics?: string;
  recommendations?: string;
  createdAt?: string;
  appointment?: Appointment;
  doctor?: User;
  patient?: User;
  roomUrl?: string;
  token?: string;
}

export interface ConsultationEvent {
  type: 'patient_joined' | 'patient_left' | 'doctor_joined' | 'doctor_left' | 'status_updated';
  timestamp: string;
  payload?: Record<string, any>;
}

export interface CompleteConsultationDto {
  summary: string;
  prescriptionUrl?: string;
  recommendations?: string;
  diagnostics?: string;
}

// DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface CreateAppointmentDto {
  doctorId: string;
  patientId: string;
  appointmentDate: string;
  duration?: number;
  reason: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  appointmentDate?: string;
  duration?: number;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
}
