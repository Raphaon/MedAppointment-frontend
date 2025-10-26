import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationService, Notification } from '@app/core/services/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { take } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    ConfirmDialogComponent,
    MatTooltipModule
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notificationMenu" 
            [matBadge]="unreadCount" 
            [matBadgeHidden]="unreadCount === 0"
            matBadgeColor="warn">
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <div class="notification-header" (click)="$event.stopPropagation()">
        <div class="title-group">
          <h3>Notifications</h3>
          <span class="realtime-indicator" [class.connected]="realtimeConnected">
            <span class="dot"></span>
            Temps réel {{ realtimeConnected ? 'actif' : 'en veille' }}
          </span>
        </div>
        <div class="header-actions">
          <button mat-icon-button (click)="sync()" [disabled]="isSyncing" matTooltip="Synchroniser">
            <mat-icon [class.spin]="isSyncing">refresh</mat-icon>
          </button>
          <button mat-button (click)="markAllAsRead()" *ngIf="unreadCount > 0">
            <mat-icon>done_all</mat-icon>
            Tout marquer lu
          </button>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="notifications-list" *ngIf="notifications.length > 0">
        <div *ngFor="let notification of notifications" 
             class="notification-item"
             [class.unread]="!notification.read"
             [class.info]="notification.type === 'info'"
             [class.success]="notification.type === 'success'"
             [class.warning]="notification.type === 'warning'"
             [class.error]="notification.type === 'error'"
             (click)="handleNotificationClick(notification)">
          
          <div class="notification-icon">
            <mat-icon>{{ getIcon(notification.type) }}</mat-icon>
          </div>

          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ getTimeAgo(notification.timestamp) }}</div>
          </div>

          <button mat-icon-button 
                  (click)="deleteNotification($event, notification.id)"
                  class="delete-btn">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="no-notifications" *ngIf="notifications.length === 0">
        <mat-icon>notifications_none</mat-icon>
        <p>Aucune notification</p>
      </div>

      <mat-divider *ngIf="notifications.length > 0"></mat-divider>

      <div class="notification-footer" *ngIf="notifications.length > 0" (click)="$event.stopPropagation()">
        <button mat-button color="warn" (click)="clearAll()">
          <mat-icon>delete_sweep</mat-icon>
          Tout supprimer
        </button>
      </div>
    </mat-menu>
  `,
  styles: [`
    ::ng-deep .notification-menu {
      max-width: 400px;
      max-height: 600px;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .notification-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    .realtime-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      background: #f5f5f5;
      color: #777;
      padding: 4px 8px;
      border-radius: 999px;
    }

    .realtime-indicator.connected {
      color: #2e7d32;
      background: #e8f5e9;
    }

    .realtime-indicator .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f44336;
    }

    .realtime-indicator.connected .dot {
      background: #2e7d32;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .header-actions .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      gap: 12px;
      padding: 16px;
      cursor: pointer;
      transition: background-color 0.2s;
      position: relative;
      border-left: 4px solid transparent;
    }

    .notification-item:hover {
      background-color: #f5f5f5;
    }

    .notification-item.unread {
      background-color: #f0f4ff;
    }

    .notification-item.info {
      border-left-color: #2196f3;
    }

    .notification-item.success {
      border-left-color: #4caf50;
    }

    .notification-item.warning {
      border-left-color: #ff9800;
    }

    .notification-item.error {
      border-left-color: #f44336;
    }

    .notification-icon {
      flex-shrink: 0;
    }

    .notification-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .notification-item.info .notification-icon mat-icon {
      color: #2196f3;
    }

    .notification-item.success .notification-icon mat-icon {
      color: #4caf50;
    }

    .notification-item.warning .notification-icon mat-icon {
      color: #ff9800;
    }

    .notification-item.error .notification-icon mat-icon {
      color: #f44336;
    }

    .notification-content {
      flex: 1;
    }

    .notification-title {
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
    }

    .notification-message {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }

    .notification-time {
      font-size: 12px;
      color: #999;
    }

    .delete-btn {
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .notification-item:hover .delete-btn {
      opacity: 1;
    }

    .no-notifications {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      color: #999;
    }

    .no-notifications mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }

    .notification-footer {
      padding: 12px 16px;
      display: flex;
      justify-content: center;
    }
  `]
})
export class NotificationCenterComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;
  isSyncing = false;
  realtimeConnected = false;

  constructor(
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe((notifications: Notification[]) => {
      this.notifications = notifications;
    });

    this.notificationService.unreadCount$.subscribe((count: number) => {
      this.unreadCount = count;
    });

    this.notificationService.isSyncing$.subscribe((syncing: boolean) => {
      this.isSyncing = syncing;
    });

    this.notificationService.realtimeConnected$.subscribe((connected: boolean) => {
      this.realtimeConnected = connected;
    });
  }

  getIcon(type: string): string {
    const icons: any = {
      info: 'info',
      success: 'check_circle',
      warning: 'warning',
      error: 'error'
    };
    return icons[type] || 'notifications';
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days}j`;
    if (hours > 0) return `Il y a ${hours}h`;
    if (minutes > 0) return `Il y a ${minutes}m`;
    return 'À l\'instant';
  }

  handleNotificationClick(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
    if (notification.link) {
      // Navigation sera gérée par le router si nécessaire
    }
  }

  deleteNotification(event: Event, id: string): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  sync(): void {
    this.notificationService.refreshFromServer();
  }

  clearAll(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Tout supprimer ?',
        message: 'Voulez-vous vraiment supprimer toutes les notifications ? Cette action est irréversible.',
        confirmLabel: 'Tout supprimer',
        icon: 'delete_sweep'
      },
      autoFocus: false,
      restoreFocus: false
    }).afterClosed().pipe(take(1)).subscribe((confirmed) => {
      if (confirmed) {
        this.notificationService.clearAll();
      }
    });
  }
}