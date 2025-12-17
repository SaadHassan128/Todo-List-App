import { AuthState } from './user.interface';
import { Task } from './task.interface';
import { AppNotification } from './notification.interface';

export interface AppState {
  auth: AuthState;
  tasks: Task[];
  notifications: AppNotification[];
  ui: {
    theme: 'light' | 'dark' | 'auto';
    sidebarOpen: boolean;
    loading: boolean;
    error: string | null;
  };
}

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  thisWeek: number;
  completionRate: number;
  weeklyProgress: { date: string; completed: number; total: number }[];
  categoryStats: { category: string; count: number; completed: number }[];
  priorityStats: { high: number; medium: number; low: number };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}
