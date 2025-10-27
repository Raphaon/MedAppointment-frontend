import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ChatConversation, ChatParticipant, ChatMessage, CreateChatConversationDto, SendChatMessagePayload } from '../models';
import { environment } from '../../../environments/environment';

export interface ChatConversationsResponse {
  conversations: ChatConversation[];
}

export interface ChatConversationResponse {
  conversation: ChatConversation;
  messages: ChatMessage[];
}

export interface ChatMessageResponse {
  message: ChatMessage;
}

export interface ChatReadResponse {
  conversation: ChatConversation;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = `${environment.apiBaseUrl}/chats`;

  readonly currentUser: ChatParticipant = {
    id: 'doctor-1',
    name: 'Dr. Léa Martin',
    role: 'DOCTOR'
  };

  constructor(private readonly http: HttpClient) {}

  getConversations(userId: string): Observable<ChatConversationsResponse> {
    return this.http.get<ChatConversationsResponse>(this.apiUrl, { params: { userId } });
  }

  getConversation(conversationId: string, userId: string): Observable<ChatConversationResponse> {
    return this.http.get<ChatConversationResponse>(`${this.apiUrl}/${conversationId}`, { params: { userId } });
  }

  createConversation(payload: CreateChatConversationDto): Observable<{ conversation: ChatConversation }> {
    return this.http.post<{ conversation: ChatConversation }>(this.apiUrl, payload);
  }

  sendMessage(conversationId: string, payload: SendChatMessagePayload): Observable<ChatMessageResponse> {
    const formData = new FormData();
    if (payload.content) {
      formData.append('content', payload.content);
    }

    formData.append('senderId', payload.senderId);
    formData.append('senderName', payload.senderName);
    if (payload.senderRole) {
      formData.append('senderRole', payload.senderRole);
    }

    payload.files?.forEach(file => formData.append('files', file, file.name));

    return this.http.post<ChatMessageResponse>(`${this.apiUrl}/${conversationId}/messages`, formData);
  }

  markConversationAsRead(conversationId: string, userId: string): Observable<ChatReadResponse> {
    return this.http.post<ChatReadResponse>(`${this.apiUrl}/${conversationId}/read`, { userId });
  }
}
