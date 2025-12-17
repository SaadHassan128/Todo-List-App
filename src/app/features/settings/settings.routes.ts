import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    data: { title: 'Settings' }
  }
];
