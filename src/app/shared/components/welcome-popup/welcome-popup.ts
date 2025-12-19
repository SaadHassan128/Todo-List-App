import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-popup',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
        animate('300ms ease-out')
      ]),
      transition('* => void', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }))
      ])
    ])
  ],
  template: `
    <div
      *ngIf="show"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @fadeInOut
    >
      <div
        class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500 p-8 text-white text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
          <div class="relative z-10">
            <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-4xl">🎉</span>
            </div>
            <h1 class="text-3xl font-bold mb-2">Welcome to TodoApp!</h1>
            <p class="text-primary-100 text-lg">Let's get you started with your productivity journey</p>
          </div>
        </div>

        <!-- Content -->
        <div class="p-8 overflow-y-auto max-h-[60vh]">
          <div class="space-y-6">
            <div class="text-center mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Discover Amazing Features</h2>
              <p class="text-gray-600 dark:text-gray-400">Everything you need to stay organized and productive</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Feature Cards -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <span class="text-2xl">📋</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Task Management</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">Create, organize, and track tasks with intelligent categorization and priority levels.</p>
              </div>

              <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
                <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                  <span class="text-2xl">🎯</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Goal Tracking</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">Set goals, track progress, and celebrate achievements with visual progress indicators.</p>
              </div>

              <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
                <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <span class="text-2xl">📅</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Calendar Integration</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">View tasks on a calendar, set due dates, and get timely reminders for important deadlines.</p>
              </div>

              <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <div class="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mb-4">
                  <span class="text-2xl">🔔</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Notifications</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">Receive intelligent notifications about due tasks, progress updates, and important reminders.</p>
              </div>

              <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl border border-red-200 dark:border-red-700">
                <div class="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
                  <span class="text-2xl">📊</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">Track your productivity with detailed analytics, charts, and performance insights.</p>
              </div>

              <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-700">
                <div class="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mb-4">
                  <span class="text-2xl">🎨</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Personalization</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">Customize your experience with themes, layouts, and settings tailored to your preferences.</p>
              </div>
            </div>

            <div class="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-700">
              <div class="flex items-center space-x-4">
                <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <span class="text-2xl text-white">🚀</span>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Ready to Get Started?</h3>
                  <p class="text-gray-600 dark:text-gray-400">Complete your profile to unlock all features and personalize your experience.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            (click)="dismiss()"
            class="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Skip for now
          </button>

          <div class="flex space-x-3">
            <button
              (click)="handleGoToProfile()"
              class="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Complete Profile →
            </button>
          </div>
        </div>

        <!-- Close Button -->
        <button
          (click)="dismiss()"
          class="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class WelcomePopupComponent implements OnInit {
  @Input() show = false;
  @Output() dismissed = new EventEmitter<void>();
  @Output() goToProfile = new EventEmitter<void>();

  constructor(private router: Router) {}

  ngOnInit(): void {}

  dismiss(): void {
    this.show = false;
    this.dismissed.emit();
  }

  handleGoToProfile(): void {
    this.show = false;
    this.goToProfile.emit();
  }
}
