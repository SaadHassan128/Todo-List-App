import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
          <p class="text-gray-600 dark:text-gray-400">Enter your email address and we'll send you a reset link</p>
        </div>

        <div class="glass-card p-8 rounded-2xl shadow-xl">
          <div class="text-center mb-6">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <svg class="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p class="text-gray-600 dark:text-gray-400">
              For demo purposes, any valid email will show a success message.
            </p>
          </div>

          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div class="flex">
              <svg class="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <p class="text-sm text-green-700 dark:text-green-400">
                Password reset instructions have been sent to your email address.
              </p>
            </div>
          </div>

          <div class="text-center">
            <a routerLink="/auth/login" class="btn-primary px-6 py-3 rounded-lg font-medium">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ForgotPasswordComponent {}
