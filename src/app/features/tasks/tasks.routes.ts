import { Routes } from '@angular/router';

export const tasksRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tasks/tasks.component').then(m => m.TasksComponent),
    data: { title: 'Tasks' }
  },
  {
    path: ':id',
    loadComponent: () => import('./task-detail/task-detail.component').then(m => m.TaskDetailComponent),
    data: { title: 'Task Details' }
  }
];
