// Énumérations
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  NURSE = 'NURSE'
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
  nurseProfile?: NurseProfile;
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
  hospitalIds?: string[];
  hospitals?: HospitalSummary[];
  departmentIds?: string[];
  departments?: HospitalDepartment[];
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

export interface NurseProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  yearsExperience?: number;
  primaryDepartment?: string;
  skills?: string;
  bio?: string;
  user?: User;
  hospitalIds?: string[];
  hospitals?: HospitalSummary[];
  departmentIds?: string[];
  departments?: HospitalDepartment[];
}

export interface HospitalSummary {
  id: string;
  name: string;
  city?: string;
  country?: string;
}

export interface HospitalStaffMember {
  id: string;
  userId: string;
  role: UserRole;
  assignedDepartmentIds?: string[];
  user?: User;
}

export interface HospitalDepartment {
  id: string;
  hospitalId?: string;
  name: string;
  description?: string;
  specialty?: MedicalSpecialty | null;
  doctorIds: string[];
  nurseIds: string[];
  staff?: HospitalStaffMember[];
}

export interface Hospital {
  id: string;
  name: string;
  description?: string;
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  services?: HospitalDepartment[];
  doctors?: DoctorProfile[];
  staff?: HospitalStaffMember[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertHospitalDepartmentDto {
  id?: string;
  hospitalId?: string;
  name: string;
  description?: string;
  specialty?: MedicalSpecialty | null;
  doctorIds: string[];
  nurseIds: string[];
}

export interface CreateHospitalDto {
  name: string;
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  description?: string;
  services?: UpsertHospitalDepartmentDto[];
}

export interface UpdateHospitalDto extends Partial<CreateHospitalDto> {}

export interface PatientVital {
  id: string;
  appointmentId: string;
  recordedBy: string;
  recordedAt: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  weight?: number;
  notes?: string;
  nurse?: User;
}

export interface RecordPatientVitalDto {
  temperature?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  weight?: number | null;
  notes?: string | null;
}

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  issuedAt: string;
  notes?: string;
  items: PrescriptionItem[];
  doctor?: User;
  patient?: User;
}

export interface CreatePrescriptionDto {
  notes?: string;
  items: PrescriptionItem[];
}

export interface UpdatePrescriptionDto extends Partial<CreatePrescriptionDto> {}

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
  hospitalId?: string;
  departmentId?: string;
  hospital?: Hospital;
  department?: HospitalDepartment;
  vitals?: PatientVital[];
  prescriptions?: Prescription[];
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
  hospitalId?: string;
  departmentId?: string;
}

export interface UpdateAppointmentDto {
  appointmentDate?: string;
  duration?: number;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
  hospitalId?: string;
  departmentId?: string;
}
