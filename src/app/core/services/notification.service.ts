import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Charger les notifications depuis le localStorage
    this.loadNotifications();
  }

  private loadNotifications(): void {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const notifications: Notification[] = JSON.parse(stored);
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount();
    }
  }

  private saveNotifications(): void {
    const notifications = this.notificationsSubject.value;
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...current]);
    this.saveNotifications();
    this.updateUnreadCount();
  }

  markAsRead(id: string): void {
    const notifications = this.notificationsSubject.value.map((n: Notification) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(notifications);
    this.saveNotifications();
    this.updateUnreadCount();
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map((n: Notification) => ({
      ...n,
      read: true
    }));
    this.notificationsSubject.next(notifications);
    this.saveNotifications();
    this.updateUnreadCount();
  }

  deleteNotification(id: string): void {
    const notifications = this.notificationsSubject.value.filter((n: Notification) => n.id !== id);
    this.notificationsSubject.next(notifications);
    this.saveNotifications();
    this.updateUnreadCount();
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
    localStorage.removeItem('notifications');
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    const count = this.notificationsSubject.value.filter((n: Notification) => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Méthodes utilitaires pour créer des notifications
  success(title: string, message: string, link?: string): void {
    this.addNotification({ type: 'success', title, message, link });
  }

  error(title: string, message: string, link?: string): void {
    this.addNotification({ type: 'error', title, message, link });
  }

  warning(title: string, message: string, link?: string): void {
    this.addNotification({ type: 'warning', title, message, link });
  }

  info(title: string, message: string, link?: string): void {
    this.addNotification({ type: 'info', title, message, link });
  }
}