import { Injectable, OnDestroy } from '@angular/core';
import { TaskService } from './task.service';
import { NotificationPopupService } from './notification-popup.service';
import { ConfirmationDialogService } from './confirmation-dialog.service';
import { NotificationData } from '../components/notification-popup/notification-popup.component';

@Injectable({
  providedIn: 'root',
})
export class AlarmService implements OnDestroy {
  private checkInterval: any;
  private readonly CHECK_INTERVAL = 60000; // Check every minute

  constructor(
    private taskService: TaskService,
    private notificationPopupService: NotificationPopupService,
    private confirmationDialogService: ConfirmationDialogService
  ) {
    this.startAlarmChecking();
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private startAlarmChecking(): void {
    // Check immediately on start
    this.checkForDueTasks();

    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkForDueTasks();
    }, this.CHECK_INTERVAL);
  }

  private async checkForDueTasks(): Promise<void> {
    const dueTasks = this.taskService.checkForDueTasks();

    for (const task of dueTasks) {
      // Skip if already notified recently (within last hour)
      if (task.lastNotified) {
        const timeSinceLastNotification = Date.now() - task.lastNotified.getTime();
        if (timeSinceLastNotification < 60 * 60 * 1000) {
          // 1 hour
          continue;
        }
      }

      // Show browser notification
      await this.showBrowserNotification(task);

      // Show centered reminder dialog
      await this.showReminderDialog(task);

      // Mark as notified
      this.taskService.updateLastNotified(task.id);
    }
  }

  private async showBrowserNotification(task: any): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const dueTime = this.getDueTimeText(task);
      const notification = new Notification('Task Due Soon', {
        body: `"${task.title}" is due ${dueTime}`,
        icon: '/todo-icon-5.jpg',
        badge: '/todo-icon-5.jpg',
        tag: `task-${task.id}`,
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Play alarm sound if available
      if (task.alarmSound && task.alarmSound !== 'default') {
        this.playAlarmSound(task.alarmSound);
      }
    }
  }

  private getDueTimeText(task: any): string {
    if (!task.dueDate) return 'soon';

    const now = new Date();
    const dueDateTime = this.combineDateAndTime(task.dueDate, task.dueTime);
    const diffInMinutes = Math.floor((dueDateTime.getTime() - now.getTime()) / (1000 * 60));

    if (diffInMinutes <= 0) return 'now';
    if (diffInMinutes < 60) return `in ${diffInMinutes} minutes`;
    if (diffInMinutes < 1440) return `in ${Math.floor(diffInMinutes / 60)} hours`;

    const diffInDays = Math.floor(diffInMinutes / 1440);
    return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
  }

  private combineDateAndTime(date: Date, time?: string): Date {
    const combined = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      combined.setHours(hours, minutes, 0, 0);
    }
    return combined;
  }

  private async showReminderDialog(task: any): Promise<void> {
    const dueTimeText = this.getDueTimeText(task);
    const dueDateText = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    const dueTimeDisplay = task.dueTime ? task.dueTime : '';
    const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown';

    let message = `📋 TASK REMINDER\n\n`;
    message += `📌 Title: ${task.title}\n\n`;

    if (task.description) {
      message += `📝 Description: ${task.description}\n\n`;
    }

    message += `⚡ Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}\n`;
    message += `📅 Due Date: ${dueDateText}`;
    if (dueTimeDisplay) {
      message += ` at ${dueTimeDisplay}`;
    }
    message += `\n`;
    message += `📊 Status: ${task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}\n`;
    message += `📂 Category: ${task.category || 'General'}\n`;

    if (task.tags && task.tags.length > 0) {
      message += `🏷️ Tags: ${task.tags.join(', ')}\n`;
    }

    message += `📅 Created: ${createdDate}\n\n`;
    message += `⏰ ALERT: This task is due ${dueTimeText}!\n`;
    message += `Don't forget to complete it!`;

    // Show custom reminder notification
    this.showReminderNotification(task, message);

    // Mark as notified immediately - popup will stay until user dismisses it
    this.taskService.updateLastNotified(task.id);
  }

  private showReminderNotification(task: any, message: string): void {
    this.notificationPopupService.showCustom('⏰ Task Reminder', message, 'task-created');
  }

  private playAlarmSound(sound: string): void {
    // For now, just use the default browser notification sound
    // In a real app, you might load custom audio files
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play alarm sound:', error);
    }
  }

  // Method to manually trigger alarm check (useful for testing)
  checkNow(): void {
    this.checkForDueTasks();
  }

  // Method to test reminder popup with a specific task
  testReminder(taskId: string): void {
    const task = this.taskService.getTask(taskId);
    if (task) {
      this.showReminderDialog(task);
    }
  }
}
