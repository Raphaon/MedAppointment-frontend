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

export enum MedicalRecordEntryType {
  CONSULTATION_NOTE = 'CONSULTATION_NOTE',
  PRESCRIPTION = 'PRESCRIPTION',
  EXAMINATION = 'EXAMINATION',
  DOCUMENT = 'DOCUMENT'
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

export interface MedicalRecordEntry {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  createdAt: string;
  updatedAt: string;
  type: MedicalRecordEntryType;
  title: string;
  content: string;
  tags?: string[];
}

export interface Consultation {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  startedAt?: string;
  endedAt?: string;
  notes?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  followUpDate?: string;
  medicalRecords?: MedicalRecordEntry[];
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

export interface StartConsultationDto {
  appointmentId: string;
}

export interface UpdateConsultationDto {
  notes?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  followUpDate?: string;
}

export interface CompleteConsultationDto extends UpdateConsultationDto {
  summary?: string;
}

export interface CreateMedicalRecordEntryDto {
  type: MedicalRecordEntryType;
  title: string;
  content: string;
  tags?: string[];
}
