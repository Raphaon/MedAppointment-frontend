import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, of, timer } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface ServerNotificationDto {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiBaseUrl}/notifications`;
  private readonly syncIntervalMs = 60000;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private syncingSubject = new BehaviorSubject<boolean>(false);
  public isSyncing$ = this.syncingSubject.asObservable();

  private realtimeSubject = new BehaviorSubject<boolean>(false);
  public realtimeConnected$ = this.realtimeSubject.asObservable();

  private pollingSub?: Subscription;
  private authSub?: Subscription;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadNotifications();
    this.monitorAuthState();
  }

  private monitorAuthState(): void {
    const hasToken = !!this.authService.getToken();
    if (hasToken) {
      this.startSynchronization();
    }

    this.authSub = this.authService.currentUser$.subscribe(() => {
      const authenticated = !!this.authService.getToken();
      if (authenticated) {
        this.startSynchronization();
      } else {
        this.stopSynchronization({ clear: true });
      }
    });
  }

  private startSynchronization(): void {
    if (this.pollingSub) {
      return;
    }

    this.syncWithServer();
    this.pollingSub = timer(this.syncIntervalMs, this.syncIntervalMs)
      .subscribe(() => this.syncWithServer());
    this.realtimeSubject.next(true);
  }

  private stopSynchronization(options: { clear?: boolean } = {}): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = undefined;
    }

    this.syncingSubject.next(false);
    this.realtimeSubject.next(false);

    if (options.clear) {
      this.notificationsSubject.next([]);
      localStorage.removeItem('notifications');
      this.updateUnreadCount();
    }
  }

  private loadNotifications(): void {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const notifications: Notification[] = JSON.parse(stored).map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount();
    }
  }

  private saveNotifications(): void {
    const notifications = this.notificationsSubject.value;
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }

  syncWithServer(): void {
    if (this.syncingSubject.value || !this.authService.getToken()) {
      return;
    }

    this.syncingSubject.next(true);
    this.http.get<{ notifications?: ServerNotificationDto[]; unreadCount?: number }>(this.apiUrl)
      .pipe(
        tap((response) => {
          if (response.notifications) {
            const normalized = response.notifications.map((dto) => this.normalizeNotification(dto));
            this.mergeNotifications(normalized);
          }
          if (typeof response.unreadCount === 'number') {
            this.unreadCountSubject.next(response.unreadCount);
          } else {
            this.updateUnreadCount();
          }
        }),
        catchError((error) => {
          console.warn('Échec de la synchronisation des notifications', error);
          if (error?.status === 401) {
            this.stopSynchronization();
          }
          return of(null);
        }),
        finalize(() => this.syncingSubject.next(false))
      )
      .subscribe();
  }

  refreshFromServer(): void {
    this.syncWithServer();
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    this.upsertNotification(newNotification);
  }

  markAsRead(id: string): void {
    this.updateNotification(id, { read: true });
    this.http.patch(`${this.apiUrl}/${id}/read`, {}).pipe(catchError(() => of(null))).subscribe();
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map((n: Notification) => ({
      ...n,
      read: true
    }));
    this.notificationsSubject.next(notifications);
    this.saveNotifications();
    this.updateUnreadCount();
    this.http.post(`${this.apiUrl}/mark-all-read`, {}).pipe(catchError(() => of(null))).subscribe();
  }

  deleteNotification(id: string): void {
    const notifications = this.notificationsSubject.value.filter((n: Notification) => n.id !== id);
    this.notificationsSubject.next(notifications);
    this.saveNotifications();
    this.updateUnreadCount();
    this.http.delete(`${this.apiUrl}/${id}`).pipe(catchError(() => of(null))).subscribe();
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
    localStorage.removeItem('notifications');
    this.updateUnreadCount();
    this.http.delete(this.apiUrl).pipe(catchError(() => of(null))).subscribe();
  }

  private mergeNotifications(incoming: Notification[]): void {
    const existing = new Map(this.notificationsSubject.value.map((n) => [n.id, n] as const));
    incoming.forEach((notification) => {
      const current = existing.get(notification.id);
      existing.set(notification.id, { ...current, ...notification });
    });

    const merged = Array.from(existing.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    this.notificationsSubject.next(merged);
    this.saveNotifications();
    this.updateUnreadCount();
  }

  private upsertNotification(notification: Notification): void {
    const existing = this.notificationsSubject.value;
    const index = existing.findIndex((n) => n.id === notification.id);
    let updated: Notification[];

    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...existing[index], ...notification };
    } else {
      updated = [notification, ...existing];
    }

    updated.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    this.notificationsSubject.next(updated);
    this.saveNotifications();
    this.updateUnreadCount();
  }

  private updateNotification(id: string, patch: Partial<Notification>): void {
    const updated = this.notificationsSubject.value.map((notification) =>
      notification.id === id ? { ...notification, ...patch } : notification
    );
    this.notificationsSubject.next(updated);
    this.saveNotifications();
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    const count = this.notificationsSubject.value.filter((n: Notification) => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  private normalizeNotification(dto: ServerNotificationDto): Notification {
    return {
      id: dto.id,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      timestamp: new Date(dto.timestamp),
      read: dto.read ?? false,
      link: dto.link
    };
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
