import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'warning' | 'info' | 'success' | 'danger';
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isVisible"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      (click)="onBackdropClick($event)"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-slideIn"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-3">
            <div [class]="getIconClasses()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="data?.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                <path *ngIf="data?.type === 'info'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                <path *ngIf="data?.type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                <path *ngIf="data?.type === 'danger'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ data?.title }}
            </h2>
          </div>
          <button
            (click)="cancel()"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
            {{ data?.message }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            (click)="cancel()"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            {{ data?.cancelText || 'Cancel' }}
          </button>
          <button
            (click)="confirm()"
            [class]="getConfirmButtonClasses()"
          >
            {{ data?.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }

    .animate-slideIn {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class ConfirmationDialogComponent {
  @Input() isVisible = false;
  @Input() data?: ConfirmationDialogData;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Only close if clicking directly on backdrop, not on child elements
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  getIconClasses(): string {
    const baseClasses = 'w-10 h-10 rounded-full flex items-center justify-center';

    switch (this.data?.type) {
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'info':
        return `${baseClasses} bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400`;
      case 'success':
        return `${baseClasses} bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400`;
      case 'danger':
        return `${baseClasses} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  getConfirmButtonClasses(): string {
    const baseClasses = 'px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';

    switch (this.data?.type) {
      case 'warning':
        return `${baseClasses} text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500`;
      case 'info':
        return `${baseClasses} text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
      case 'success':
        return `${baseClasses} text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`;
      case 'danger':
        return `${baseClasses} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      default:
        return `${baseClasses} text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500`;
    }
  }
}
