import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface CongratulationData {
  id: string;
  message: string;
  taskTitle: string;
  timestamp: Date;
}

@Component({
  selector: 'app-congratulation-popup',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        transform: 'translateX(0) scale(1)',
        opacity: 1
      })),
      transition('void => in', [
        style({
          transform: 'translateX(50px) scale(0.95)',
          opacity: 0
        }),
        animate('400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)')
      ]),
      transition('in => void', [
        animate('300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          style({
            transform: 'translateX(50px) scale(0.95)',
            opacity: 0
          })
        )
      ])
    ])
  ],
  template: `
    <div
      *ngIf="congratulation"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @slideInOut
    >
      <!-- Congratulation Card -->
      <div class="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl shadow-2xl border border-primary-200 dark:border-primary-700 max-w-lg w-full overflow-hidden">

        <!-- Header -->
        <div class="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-white">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold">Congratulations! 🎉</h2>
              <p class="text-primary-100 text-sm">Task Completed Successfully</p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              "{{ congratulation.taskTitle }}"
            </h3>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {{ congratulation.message }}
            </p>
            <div class="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{{ getTimeAgo(congratulation.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 pb-6">
          <button
            (click)="close()"
            class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Continue Your Journey 🚀
          </button>
        </div>

        <!-- Decorative Elements -->
        <div class="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div class="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CongratulationPopupComponent implements OnInit, OnDestroy {
  @Input() congratulation: CongratulationData | null = null;
  @Input() autoDismissDelay = 6000; // 6 seconds for congratulations
  @Output() dismissed = new EventEmitter<string>();

  private dismissTimeoutId: any;

  ngOnInit(): void {
    // Don't start auto-dismiss on init to avoid change detection issues
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  ngOnChanges(): void {
    if (this.congratulation) {
      this.clearTimers();
      if (this.autoDismissDelay > 0) {
        // Use setTimeout to avoid change detection issues
        setTimeout(() => this.startAutoDismiss(), 0);
      }
    }
  }

  close(): void {
    this.clearTimers();
    if (this.congratulation) {
      this.dismissed.emit(this.congratulation.id);
    }
  }

  private startAutoDismiss(): void {
    this.dismissTimeoutId = setTimeout(() => {
      this.close();
    }, this.autoDismissDelay);
  }

  private clearTimers(): void {
    if (this.dismissTimeoutId) {
      clearTimeout(this.dismissTimeoutId);
      this.dismissTimeoutId = null;
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
