import { Injectable, signal } from '@angular/core';
import { NotificationData } from '../components/notification-popup/notification-popup.component';
import { CongratulationData } from '../components/congratulation-popup/congratulation-popup.component';

@Injectable({
  providedIn: 'root',
})
export class NotificationPopupService {
  private _notifications = signal<NotificationData[]>([]);
  private _congratulations = signal<CongratulationData[]>([]);

  public readonly notifications$ = this._notifications.asReadonly();
  public readonly congratulations$ = this._congratulations.asReadonly();

  show(notification: Omit<NotificationData, 'id' | 'timestamp'>): void {
    const newNotification: NotificationData = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this._notifications.update((notifications) => [newNotification, ...notifications]);

    // Auto-remove after 5 seconds (handled by component)
  }

  showCustom(title: string, message: string, type: NotificationData['type'] = 'task-created'): void {
    this.show({
      type,
      title,
      message,
      taskTitle: '',
    });
  }

  dismiss(notificationId: string): void {
    this._notifications.update((notifications) =>
      notifications.filter((n) => n.id !== notificationId)
    );
  }

  dismissCongratulation(congratulationId: string): void {
    this._congratulations.update((congratulations) =>
      congratulations.filter((c) => c.id !== congratulationId)
    );
  }

  showTaskCreated(taskTitle: string): void {
    this.show({
      type: 'task-created',
      title: 'Task Created',
      message: `Successfully created "${taskTitle}"`,
      taskTitle,
    });
  }

  showTaskUpdated(taskTitle: string, changes: string[]): void {
    this.show({
      type: 'task-updated',
      title: 'Task Updated',
      message: `Updated "${taskTitle}": ${changes.join(', ')}`,
      taskTitle,
    });
  }

  showPriorityChanged(taskTitle: string, oldPriority: string, newPriority: string): void {
    this.show({
      type: 'priority-changed',
      title: 'Priority Changed',
      message: `Changed "${taskTitle}" priority from ${oldPriority} to ${newPriority}`,
      taskTitle,
    });
  }

  showStatusChanged(taskTitle: string, oldStatus: string, newStatus: string): void {
    this.show({
      type: 'status-changed',
      title: 'Status Changed',
      message: `Changed "${taskTitle}" status from ${oldStatus} to ${newStatus}`,
      taskTitle,
    });
  }

  showTaskCompleted(taskTitle: string): void {
    const congratulatoryMessages = [
      `Fantastic! "${taskTitle}" is now complete. Keep up the great work!`,
      `Well done! "${taskTitle}" has been successfully finished. You're on fire!`,
      `Congratulations! "${taskTitle}" is done. Every small win counts!`,
      `Amazing work! "${taskTitle}" is complete. You're making great progress!`,
      `Excellent! "${taskTitle}" has been completed. Stay motivated and keep going!`,
    ];

    const randomMessage =
      congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)];

    const congratulation: CongratulationData = {
      id: this.generateId(),
      message: randomMessage,
      taskTitle,
      timestamp: new Date(),
    };

    this._congratulations.update((congratulations) => [congratulation, ...congratulations]);
  }

  showTaskDeleted(taskTitle: string): void {
    this.show({
      type: 'task-updated', // Reuse task-updated icon for deletion
      title: 'Task Deleted',
      message: `"${taskTitle}" has been successfully deleted.`,
      taskTitle,
    });
  }

  showTasksDeleted(count: number): void {
    this.show({
      type: 'task-updated',
      title: 'Tasks Deleted',
      message: `Successfully deleted ${count} task${count > 1 ? 's' : ''}.`,
      taskTitle: '',
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
