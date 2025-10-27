import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { DatePipe, NgFor, NgIf } from '@angular/common';

interface UpcomingAppointment {
  id: string;
  doctor: string;
  date: string;
  time: string;
  type: 'Présentiel' | 'Téléconsultation';
  location: string;
}

interface QuickAction {
  label: string;
  icon: string;
}

interface HealthStat {
  label: string;
  value: string;
  description: string;
  icon: string;
}

interface Reminder {
  title: string;
  subtitle: string;
  icon: string;
  status?: 'ready' | 'pending';
}

@Component({
  selector: 'app-mobile-patient-home',
  standalone: true,
  imports: [
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    NgFor,
    NgIf,
    DatePipe
  ],
  templateUrl: './mobile-patient-home.component.html',
  styleUrls: ['./mobile-patient-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobilePatientHomeComponent {
  readonly patientName = 'Clara';

  readonly quickActions: QuickAction[] = [
    { label: 'Prendre rendez-vous', icon: 'calendar-clear-outline' },
    { label: 'Télé-consultation', icon: 'videocam-outline' },
    { label: 'Historique médical', icon: 'document-text-outline' },
    { label: 'Ordonnances', icon: 'medkit-outline' }
  ];

  readonly nextAppointments: UpcomingAppointment[] = [
    {
      id: 'apt-1',
      doctor: 'Dr. Sarah Johnson',
      date: new Date().toISOString(),
      time: '10:30',
      type: 'Téléconsultation',
      location: 'Visio'
    },
    {
      id: 'apt-2',
      doctor: 'Dr. Marc Dupont',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      time: '15:00',
      type: 'Présentiel',
      location: 'Clinique Lumière'
    }
  ];

  readonly healthStats: HealthStat[] = [
    {
      label: 'Adhérence traitement',
      value: '92%',
      description: 'Sur les 30 derniers jours',
      icon: 'bandage-outline'
    },
    {
      label: 'Activité hebdomadaire',
      value: '4 séances',
      description: 'Programme de physiothérapie',
      icon: 'fitness-outline'
    },
    {
      label: 'Derniers résultats',
      value: '10 juin',
      description: 'Analyses sanguines à jour',
      icon: 'flask-outline'
    }
  ];

  readonly reminders: Reminder[] = [
    {
      title: 'Préparation consultation',
      subtitle: 'Notez vos symptômes avant 9h30',
      icon: 'clipboard-outline',
      status: 'pending'
    },
    {
      title: 'Traitement quotidien',
      subtitle: 'Prendre le médicament du soir à 21h00',
      icon: 'time-outline',
      status: 'ready'
    },
    {
      title: 'Documents partagés',
      subtitle: '2 nouveaux résultats disponibles',
      icon: 'cloud-download-outline'
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
