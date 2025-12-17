import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="text-center">
        <div class="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
        <a routerLink="/dashboard" class="btn-primary px-6 py-3 rounded-lg">Go Home</a>
      </div>
    </div>
  `,
  styles: []
})
export class NotFoundComponent {}
