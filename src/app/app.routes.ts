import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './shared/services/auth-guard.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
    canActivate: [GuestGuard],
    data: { animation: 'Auth' }
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
        data: { animation: 'Dashboard' }
      },
      {
        path: 'tasks',
        loadChildren: () => import('./features/tasks/tasks.routes').then(m => m.tasksRoutes),
        data: { animation: 'Tasks' }
      },
      {
        path: 'calendar',
        loadChildren: () => import('./features/calendar/calendar.routes').then(m => m.calendarRoutes),
        data: { animation: 'Calendar' }
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes),
        data: { animation: 'Profile' }
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then(m => m.settingsRoutes),
        data: { animation: 'Settings' }
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
