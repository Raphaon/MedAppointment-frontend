import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ChatParticipantRole,
  ChatMessageDraft,
  CreateChatConversationDto,
  SendChatMessagePayload
} from '@app/core/models';
import { ChatService } from '@app/core/services/chat.service';
import { ChatConversationListComponent } from './chat-conversation-list.component';
import { ChatMessageListComponent } from './chat-message-list.component';
import { ChatMessageInputComponent } from './chat-message-input.component';
import { ConversationTitlePipe } from './conversation-title.pipe';
import { ConversationParticipantsPipe } from './conversation-participants.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatListModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatInputModule,
    ChatConversationListComponent,
    ChatMessageListComponent,
    ChatMessageInputComponent,
    ConversationTitlePipe,
    ConversationParticipantsPipe
  ]
})
export class ChatComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly chatService = inject(ChatService);

  @ViewChild(ChatMessageInputComponent) messageInput?: ChatMessageInputComponent;

  conversations: ChatConversation[] = [];
  selectedConversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];

  loadingConversations = true;
  loadingMessages = false;
  creatingConversation = false;
  sendingMessage = false;

  readonly currentUser: ChatParticipant = this.chatService.currentUser;

  readonly newConversationForm = this.fb.nonNullable.group({
    participantName: ['', [Validators.required, Validators.minLength(2)]],
    participantRole: ['PATIENT' as ChatParticipantRole]
  });

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.loadingConversations = true;
    this.chatService
      .getConversations(this.currentUser.id)
      .pipe(finalize(() => this.markForCheck()))
      .subscribe({
        next: ({ conversations }) => {
          this.conversations = conversations;
          if (this.selectedConversation) {
            const updated = conversations.find(c => c.id === this.selectedConversation?.id);
            if (updated) {
              this.selectedConversation = updated;
            }
          }
          this.loadingConversations = false;
        },
        error: () => {
          this.loadingConversations = false;
          this.snackBar.open('Impossible de charger les conversations', 'Fermer', { duration: 3000 });
        }
      });
  }

  onConversationSelected(conversationId: string): void {
    if (!conversationId || this.loadingMessages) {
      return;
    }

    const conversation = this.conversations.find(c => c.id === conversationId) ?? null;
    this.selectedConversation = conversation;
    if (!conversation) {
      this.messages = [];
      this.markForCheck();
      return;
    }

    this.loadMessages(conversationId);
  }

  createConversation(): void {
    if (this.newConversationForm.invalid || this.creatingConversation) {
      return;
    }

    const payload: CreateChatConversationDto = {
      participantName: this.newConversationForm.value.participantName ?? '',
      participantRole: (this.newConversationForm.value.participantRole as ChatParticipantRole) ?? 'PATIENT'
    };

    this.creatingConversation = true;
    this.chatService
      .createConversation(payload)
      .pipe(take(1), finalize(() => this.markForCheck()))
      .subscribe({
        next: ({ conversation }) => {
          this.snackBar.open('Conversation créée', 'Fermer', { duration: 3000 });
          this.newConversationForm.reset({ participantName: '', participantRole: 'PATIENT' as ChatParticipantRole });
          this.conversations = [conversation, ...this.conversations.filter(c => c.id !== conversation.id)];
          this.selectedConversation = conversation;
          this.loadMessages(conversation.id);
          this.creatingConversation = false;
        },
        error: () => {
          this.snackBar.open('Impossible de créer la conversation', 'Fermer', { duration: 3000 });
          this.creatingConversation = false;
        }
      });
  }

  refreshConversation(): void {
    if (!this.selectedConversation) {
      return;
    }

    this.loadMessages(this.selectedConversation.id, true);
  }

  onMessageSend(event: ChatMessageDraft): void {
    if (!this.selectedConversation || this.sendingMessage) {
      return;
    }

    const payload: SendChatMessagePayload = {
      ...event,
      senderId: this.currentUser.id,
      senderName: this.currentUser.name
    };

    this.sendingMessage = true;
    this.chatService
      .sendMessage(this.selectedConversation.id, payload)
      .pipe(take(1), finalize(() => this.markForCheck()))
      .subscribe({
        next: ({ message }) => {
          this.messages = [...this.messages, message];
          this.updateConversationAfterMessage(message);
          this.messageInput?.reset();
          this.sendingMessage = false;
        },
        error: () => {
          this.snackBar.open('Échec de l\'envoi du message', 'Fermer', { duration: 3000 });
          this.sendingMessage = false;
        }
      });
  }

  private loadMessages(conversationId: string, silent = false): void {
    this.loadingMessages = !silent;
    this.chatService
      .getConversation(conversationId, this.currentUser.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ conversation, messages }) => {
          this.selectedConversation = conversation;
          this.messages = messages;
          this.loadingMessages = false;
          this.markConversationAsRead(conversationId);
          this.markForCheck();
        },
        error: () => {
          this.loadingMessages = false;
          this.snackBar.open('Impossible de charger les messages', 'Fermer', { duration: 3000 });
          this.markForCheck();
        }
      });
  }

  private markConversationAsRead(conversationId: string): void {
    this.chatService
      .markConversationAsRead(conversationId, this.currentUser.id)
      .pipe(take(1))
      .subscribe({
        next: ({ conversation }) => {
          this.selectedConversation = conversation;
          this.conversations = this.conversations.map(c => (c.id === conversation.id ? conversation : c));
          this.markForCheck();
        },
        error: () => {
          // Ignore read errors but log them
          console.warn('Unable to mark conversation as read');
        }
      });
  }

  private updateConversationAfterMessage(message: ChatMessage): void {
    if (!this.selectedConversation) {
      return;
    }

    const updatedConversation: ChatConversation = {
      ...this.selectedConversation,
      lastMessage: message,
      updatedAt: message.createdAt,
      unreadCount: 0
    };

    this.selectedConversation = updatedConversation;
    this.conversations = [
      updatedConversation,
      ...this.conversations.filter(c => c.id !== updatedConversation.id)
    ];
    this.markForCheck();
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}
