import { Pipe, PipeTransform } from '@angular/core';
import { ChatParticipant } from '@app/core/models';

@Pipe({
  name: 'conversationParticipants',
  standalone: true
})
export class ConversationParticipantsPipe implements PipeTransform {
  transform(participants: ChatParticipant[], currentUserId: string): string {
    if (!participants?.length) {
      return '';
    }

    return participants
      .filter(participant => participant.id !== currentUserId)
      .map(participant => `${participant.name} • ${this.translateRole(participant.role)}`)
      .join(', ');
  }

  private translateRole(role?: string): string {
    switch (role) {
      case 'DOCTOR':
        return 'Médecin';
      case 'PATIENT':
        return 'Patient';
      default:
        return role ?? '';
    }
  }
}
