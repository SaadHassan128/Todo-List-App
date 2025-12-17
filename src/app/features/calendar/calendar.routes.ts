import { Routes } from '@angular/router';

export const calendarRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./calendar/calendar.component').then(m => m.CalendarComponent),
    data: { title: 'Calendar' }
  }
];
