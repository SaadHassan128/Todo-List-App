import { Component, computed, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { User } from '../../types/user.interface';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentUser = computed(() => this.authService.currentUser$());
  unreadCount = computed(() => this.notificationService.unreadCount$());
  notifications = computed(() => this.notificationService.getUserNotifications().slice(0, 5));
  
  sidebarOpen = signal(false);
  showNotifications = signal(false);
  theme = signal<'light' | 'dark' | 'auto'>('auto');
  actualTheme = signal<'light' | 'dark'>('light');

  private themeCheckInterval?: number;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Apply theme changes
    effect(() => {
      this.applyTheme();
    });
  }

  ngOnInit(): void {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
    if (savedTheme) {
      this.theme.set(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set('auto');
      this.actualTheme.set(prefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.theme() === 'auto') {
        this.actualTheme.set(e.matches ? 'dark' : 'light');
        this.applyTheme();
      }
    });

    // Request notification permission
    this.notificationService.requestNotificationPermission();
  }

  ngOnDestroy(): void {
    if (this.themeCheckInterval) {
      clearInterval(this.themeCheckInterval);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update(show => !show);
  }

  closeNotifications(): void {
    this.showNotifications.set(false);
  }

  toggleTheme(): void {
    const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.theme());
    const nextIndex = (currentIndex + 1) % themes.length;
    this.theme.set(themes[nextIndex]);
    localStorage.setItem('theme', themes[nextIndex]);
  }

  private applyTheme(): void {
    let themeToApply: 'light' | 'dark';

    if (this.theme() === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
      this.actualTheme.set(themeToApply);
    } else {
      themeToApply = this.theme() as 'light' | 'dark';
      this.actualTheme.set(themeToApply);
    }

    if (themeToApply === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  logout(): void {
    this.authService.logout();
  }

  markNotificationAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  getThemeIcon(): string {
    switch (this.theme()) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'auto':
        return '💻';
      default:
        return '💻';
    }
  }

  getThemeLabel(): string {
    switch (this.theme()) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto';
      default:
        return 'Auto';
    }
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url.includes('/tasks')) return 'Tasks';
    if (url.includes('/calendar')) return 'Calendar';
    if (url.includes('/profile')) return 'Profile';
    if (url.includes('/settings')) return 'Settings';
    return 'TodoApp';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
}

