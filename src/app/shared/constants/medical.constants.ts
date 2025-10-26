import { MedicalSpecialty } from '@app/core/models';

type SpecialtyRecord = Record<MedicalSpecialty, string>;

export const MEDICAL_SPECIALTY_LABELS: SpecialtyRecord = {
  [MedicalSpecialty.GENERAL_PRACTICE]: 'Médecine générale',
  [MedicalSpecialty.CARDIOLOGY]: 'Cardiologie',
  [MedicalSpecialty.DERMATOLOGY]: 'Dermatologie',
  [MedicalSpecialty.PEDIATRICS]: 'Pédiatrie',
  [MedicalSpecialty.GYNECOLOGY]: 'Gynécologie',
  [MedicalSpecialty.ORTHOPEDICS]: 'Orthopédie',
  [MedicalSpecialty.PSYCHIATRY]: 'Psychiatrie',
  [MedicalSpecialty.OPHTHALMOLOGY]: 'Ophtalmologie',
  [MedicalSpecialty.ENT]: 'ORL',
  [MedicalSpecialty.NEUROLOGY]: 'Neurologie',
  [MedicalSpecialty.OTHER]: 'Autre'
};

export const MEDICAL_SPECIALTY_OPTIONS = Object.entries(MEDICAL_SPECIALTY_LABELS).map(
  ([value, label]) => ({ value: value as MedicalSpecialty, label })
);

export function getMedicalSpecialtyLabel(specialty?: MedicalSpecialty | null): string {
  if (!specialty) {
    return 'Autre';
  }

  return MEDICAL_SPECIALTY_LABELS[specialty] || specialty;
}
