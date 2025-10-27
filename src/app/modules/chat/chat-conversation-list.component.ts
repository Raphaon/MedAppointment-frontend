import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';

import { ChatConversation } from '@app/core/models';
import { ConversationTitlePipe } from './conversation-title.pipe';
import { ConversationParticipantsPipe } from './conversation-participants.pipe';

@Component({
  selector: 'chat-conversation-list',
  standalone: true,
  templateUrl: './chat-conversation-list.component.html',
  styleUrls: ['./chat-conversation-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatListModule, MatIconModule, MatProgressSpinnerModule, DatePipe, ConversationTitlePipe]
})
export class ChatConversationListComponent {
  @Input() conversations: ChatConversation[] = [];
  @Input() selectedConversationId: string | null = null;
  @Input() loading = false;
  @Input() currentUserId!: string;

  @Output() readonly selectConversation = new EventEmitter<string>();

  trackByConversation(index: number, conversation: ChatConversation): string {
    return conversation.id;
  }

  onSelect(conversation: ChatConversation): void {
    this.selectConversation.emit(conversation.id);
  }

  conversationDescription(conversation: ChatConversation): string {
    if (!conversation.lastMessage) {
      return 'Aucun message pour le moment';
    }

    if (conversation.lastMessage.content) {
      return conversation.lastMessage.content;
    }

    return conversation.lastMessage.attachments?.length
      ? `${conversation.lastMessage.attachments.length} pièce(s) jointe(s)`
      : 'Nouveau message';
  }

  isSelected(conversation: ChatConversation): boolean {
    return conversation.id === this.selectedConversationId;
  }
}
