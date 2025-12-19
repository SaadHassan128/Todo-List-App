import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NotificationData {
  id: string;
  type: 'task-created' | 'task-updated' | 'priority-changed' | 'status-changed' | 'task-completed';
  title: string;
  message: string;
  taskTitle: string;
  timestamp: Date;
}

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="notification"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
    >
      <!-- Beautiful Notification Card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full overflow-hidden transform transition-all duration-300 hover:scale-105">

        <!-- Gradient Header -->
        <div [class]="getHeaderClasses()">
          <div class="flex items-center justify-between p-5">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path *ngIf="notification.type === 'task-created'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  <path *ngIf="notification.type === 'task-updated'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  <path *ngIf="notification.type === 'priority-changed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  <path *ngIf="notification.type === 'status-changed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  <path *ngIf="notification.type === 'task-completed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white mb-1">
                  {{ notification.title }}
                </h2>
                <p class="text-white/80 text-sm">
                  {{ getSubtitle() }}
                </p>
              </div>
            </div>
            <button
              (click)="close()"
              class="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Decorative wave -->
          <div class="absolute bottom-0 left-0 w-full h-2 bg-white/10 rounded-b-2xl"></div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="notification.type === 'task-created'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                <path *ngIf="notification.type === 'task-updated'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                <path *ngIf="notification.type === 'priority-changed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                <path *ngIf="notification.type === 'status-changed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                <path *ngIf="notification.type === 'task-completed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-base">
                {{ notification.message }}
              </p>
              <div class="flex items-center justify-between mt-4">
                <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {{ getTimeAgo(notification.timestamp) }}
                </p>
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                  <div class="w-2 h-2 bg-secondary-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                  <div class="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 pb-6">
          <button
            (click)="close()"
            class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {{ getButtonText() }} ✨
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class NotificationPopupComponent implements OnInit, OnDestroy {
  @Input() notification: NotificationData | null = null;
  @Input() autoDismissDelay = 0; // 0 = no auto-dismiss
  @Output() dismissed = new EventEmitter<string>();

  progressPercent = 100;
  private intervalId: any;
  private dismissTimeoutId: any;

  ngOnInit(): void {
    if (this.notification && this.autoDismissDelay > 0) {
      this.startAutoDismiss();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  ngOnChanges(): void {
    if (this.notification) {
      this.progressPercent = 100;
      this.clearTimers();
      if (this.autoDismissDelay > 0) {
        this.startAutoDismiss();
      }
    }
  }

  close(): void {
    this.clearTimers();
    if (this.notification) {
      this.dismissed.emit(this.notification.id);
    }
  }

  private startAutoDismiss(): void {
    const startTime = Date.now();
    const endTime = startTime + this.autoDismissDelay;

    this.intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      this.progressPercent = Math.max(0, 100 - (elapsed / this.autoDismissDelay) * 100);

      if (now >= endTime) {
        this.close();
      }
    }, 50);

    this.dismissTimeoutId = setTimeout(() => {
      this.close();
    }, this.autoDismissDelay);
  }

  private clearTimers(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.dismissTimeoutId) {
      clearTimeout(this.dismissTimeoutId);
      this.dismissTimeoutId = null;
    }
  }

  getIconClasses(): string {
    const baseClasses = 'w-10 h-10 rounded-full flex items-center justify-center';

    switch (this.notification?.type) {
      case 'task-created':
        return `${baseClasses} bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400`;
      case 'task-updated':
        return `${baseClasses} bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'priority-changed':
        return `${baseClasses} bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400`;
      case 'status-changed':
        return `${baseClasses} bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400`;
      case 'task-completed':
        return `${baseClasses} bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  getHeaderClasses(): string {
    const baseClasses = 'relative overflow-hidden';

    switch (this.notification?.type) {
      case 'task-created':
        return `${baseClasses} bg-gradient-to-r from-blue-500 to-blue-600`;
      case 'task-updated':
        return `${baseClasses} bg-gradient-to-r from-red-500 to-red-600`; // Red for deletion
      case 'priority-changed':
        return `${baseClasses} bg-gradient-to-r from-purple-500 to-pink-500`;
      case 'status-changed':
        return `${baseClasses} bg-gradient-to-r from-green-500 to-teal-500`;
      case 'task-completed':
        return `${baseClasses} bg-gradient-to-r from-emerald-500 to-green-500`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-500 to-gray-600`;
    }
  }

  getSubtitle(): string {
    switch (this.notification?.type) {
      case 'task-created':
        return 'New task added to your list';
      case 'task-updated':
        return this.notification?.message?.includes('deleted') ? 'Task has been removed' : 'Task details have been modified';
      case 'priority-changed':
        return 'Priority level adjusted';
      case 'status-changed':
        return 'Task status has changed';
      case 'task-completed':
        return 'Great job! Task finished';
      default:
        return 'Notification';
    }
  }

  getButtonText(): string {
    switch (this.notification?.type) {
      case 'task-created':
        return 'Got it!';
      case 'task-updated':
        return this.notification?.message?.includes('deleted') ? 'Done' : 'Understood';
      case 'priority-changed':
        return 'Noted';
      case 'status-changed':
        return 'Perfect';
      case 'task-completed':
        return 'Awesome!';
      default:
        return 'OK';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  }
}
