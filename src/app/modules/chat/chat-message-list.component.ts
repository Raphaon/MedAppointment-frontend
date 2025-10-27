import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { ChatMessage } from '@app/core/models';

@Component({
  selector: 'chat-message-list',
  standalone: true,
  templateUrl: './chat-message-list.component.html',
  styleUrls: ['./chat-message-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, MatIconModule]
})
export class ChatMessageListComponent {
  @Input() messages: ChatMessage[] = [];
  @Input() currentUserId!: string;

  trackByMessage(index: number, message: ChatMessage): string {
    return message.id;
  }

  isOutgoing(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  trackByAttachment(index: number, attachment: ChatMessage['attachments'][number]): string {
    return attachment.id;
  }

  formatFileSize(size?: number): string {
    if (!size) {
      return '';
    }

    if (size >= 1_000_000) {
      return `${(size / 1_000_000).toFixed(1)} Mo`;
    }

    if (size >= 1_000) {
      return `${(size / 1_000).toFixed(1)} Ko`;
    }

    return `${size} o`;
  }
}
