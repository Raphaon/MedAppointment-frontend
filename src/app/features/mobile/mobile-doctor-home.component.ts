import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRow,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { CommonModule, NgFor, NgIf } from '@angular/common';

interface ScheduleEntry {
  id: string;
  patient: string;
  date: string;
  time: string;
  type: 'Présentiel' | 'Téléconsultation';
  status: 'En attente' | 'Confirmé' | 'À préparer';
}

interface DoctorStat {
  label: string;
  value: string;
  icon: string;
  trend: string;
}

interface TaskReminder {
  title: string;
  description: string;
  icon: string;
  status?: 'urgent' | 'normal';
}

@Component({
  selector: 'app-mobile-doctor-home',
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonChip,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonRow,
    IonTitle,
    IonToolbar,
    NgFor,
    NgIf
  ],
  templateUrl: './mobile-doctor-home.component.html',
  styleUrls: ['./mobile-doctor-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileDoctorHomeComponent {
  readonly doctorName = 'Dr. Élodie Martin';

  readonly stats: DoctorStat[] = [
    {
      label: 'Consultations du jour',
      value: '8',
      icon: 'calendar-number-outline',
      trend: '+2 vs hier'
    },
    {
      label: 'Patients en suivi',
      value: '24',
      icon: 'people-outline',
      trend: '4 alertes'
    },
    {
      label: 'Messages non lus',
      value: '5',
      icon: 'chatbubble-ellipses-outline',
      trend: 'Réponse moyenne 1h'
    }
  ];

  readonly todaysSchedule: ScheduleEntry[] = [
    {
      id: 'sc-1',
      patient: 'Clara Moreau',
      date: new Date().toISOString(),
      time: '08:30',
      type: 'Téléconsultation',
      status: 'Confirmé'
    },
    {
      id: 'sc-2',
      patient: 'Lucas Bernard',
      date: new Date().toISOString(),
      time: '10:00',
      type: 'Présentiel',
      status: 'À préparer'
    },
    {
      id: 'sc-3',
      patient: 'Emma Caron',
      date: new Date().toISOString(),
      time: '11:15',
      type: 'Téléconsultation',
      status: 'En attente'
    }
  ];

  readonly urgentTasks: TaskReminder[] = [
    {
      title: 'Compte-rendu à valider',
      description: 'Consultation de M. Laurent du 12/06',
      icon: 'document-text-outline',
      status: 'urgent'
    },
    {
      title: 'Renouvellement ordonnance',
      description: 'Patiente : Clara Moreau',
      icon: 'medkit-outline'
    },
    {
      title: 'Résultats reçus',
      description: 'Analyses de sang - Lucas Bernard',
      icon: 'flask-outline'
    }
  ];

  get greetingMessage(): string {
    const hours = new Date().getHours();
    if (hours < 12) {
      return 'Bonjour';
    }
    if (hours < 18) {
      return 'Bon après-midi';
    }
    return 'Bonsoir';
  }
}
