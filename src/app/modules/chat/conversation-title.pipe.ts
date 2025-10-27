import { Pipe, PipeTransform } from '@angular/core';
import { ChatConversation } from '@app/core/models';

@Pipe({
  name: 'conversationTitle',
  standalone: true
})
export class ConversationTitlePipe implements PipeTransform {
  transform(conversation: ChatConversation, currentUserId: string): string {
    const participant = conversation.participants.find(p => p.id !== currentUserId);
    return participant?.name ?? 'Conversation';
  }
}
