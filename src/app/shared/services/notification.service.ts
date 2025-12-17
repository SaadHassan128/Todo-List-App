import { Injectable, signal } from '@angular/core';
import { AppNotification } from '../../types/notification.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly STORAGE_KEY = 'todo_app_notifications';

  // Signals for reactive state management
  private _notifications = signal<AppNotification[]>([]);
  private _unreadCount = signal(0);

  // Computed signals
  public readonly notifications$ = this._notifications.asReadonly();
  public readonly unreadCount$ = this._unreadCount.asReadonly();

  constructor(private authService: AuthService) {
    this.initializeNotifications();
  }

  private initializeNotifications(): void {
    try {
      const storedNotifications = localStorage.getItem(this.STORAGE_KEY);
      if (storedNotifications) {
        const notifications = JSON.parse(storedNotifications);
        // Convert date strings back to Date objects
        const parsedNotifications = notifications.map((notification: any) => ({
          ...notification,
          createdAt: new Date(notification.createdAt)
        }));
        this._notifications.set(parsedNotifications);
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private updateUnreadCount(): void {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) {
      this._unreadCount.set(0);
      return;
    }

    const unreadCount = this._notifications()
      .filter(notification =>
        notification.userId === currentUser.id && !notification.read
      ).length;

    this._unreadCount.set(unreadCount);
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._notifications()));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }

  createNotification(notificationData: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification {
    const newNotification: AppNotification = {
      ...notificationData,
      id: this.generateId(),
      read: false,
      createdAt: new Date()
    };

    this._notifications.update(notifications => [newNotification, ...notifications]);
    this.saveNotifications();
    this.updateUnreadCount();

    // Show browser notification if permission granted
    this.showBrowserNotification(newNotification);

    return newNotification;
  }

  markAsRead(notificationId: string): boolean {
    const notificationIndex = this._notifications().findIndex(n => n.id === notificationId);
    if (notificationIndex === -1) return false;

    const currentUser = this.authService.currentUser$();
    if (!currentUser || this._notifications()[notificationIndex].userId !== currentUser.id) {
      return false;
    }

    this._notifications.update(notifications => {
      const updated = [...notifications];
      updated[notificationIndex] = { ...updated[notificationIndex], read: true };
      return updated;
    });

    this.saveNotifications();
    this.updateUnreadCount();
    return true;
  }

  markAllAsRead(): number {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return 0;

    let markedCount = 0;

    this._notifications.update(notifications =>
      notifications.map(notification => {
        if (notification.userId === currentUser.id && !notification.read) {
          markedCount++;
          return { ...notification, read: true };
        }
        return notification;
      })
    );

    if (markedCount > 0) {
      this.saveNotifications();
      this.updateUnreadCount();
    }

    return markedCount;
  }

  deleteNotification(notificationId: string): boolean {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return false;

    const notification = this._notifications().find(n => n.id === notificationId);
    if (!notification || notification.userId !== currentUser.id) return false;

    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );

    this.saveNotifications();
    this.updateUnreadCount();
    return true;
  }

  clearAllNotifications(): number {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return 0;

    let clearedCount = 0;

    this._notifications.update(notifications => {
      const filtered = notifications.filter(notification => {
        if (notification.userId === currentUser.id) {
          clearedCount++;
          return false;
        }
        return true;
      });
      return filtered;
    });

    if (clearedCount > 0) {
      this.saveNotifications();
      this.updateUnreadCount();
    }

    return clearedCount;
  }

  getUserNotifications(): AppNotification[] {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return [];

    return this._notifications()
      .filter(notification => notification.userId === currentUser.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Browser notification API
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  private showBrowserNotification(notification: AppNotification): void {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });

      browserNotification.onclick = () => {
        // Handle click - could navigate to task or notification center
        window.focus();
        browserNotification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Task-related notification helpers
  notifyTaskDue(taskTitle: string, taskId: string): void {
    this.createNotification({
      userId: this.authService.currentUser$()?.id || '',
      type: 'due-date',
      title: 'Task Due Soon',
      message: `Your task "${taskTitle}" is due soon.`,
      taskId
    });
  }

  notifyTaskOverdue(taskTitle: string, taskId: string): void {
    this.createNotification({
      userId: this.authService.currentUser$()?.id || '',
      type: 'overdue',
      title: 'Task Overdue',
      message: `Your task "${taskTitle}" is now overdue.`,
      taskId
    });
  }

  notifyTaskCompleted(taskTitle: string, taskId: string): void {
    this.createNotification({
      userId: this.authService.currentUser$()?.id || '',
      type: 'system',
      title: 'Task Completed',
      message: `Congratulations! You completed "${taskTitle}".`,
      taskId
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
