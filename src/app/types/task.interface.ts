export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: Date;
  dueTime?: string; // HH:MM format
  tags: string[];
  subtasks: SubTask[];
  attachments: Attachment[];
  createdAt: Date;
  completedAt?: Date;
  estimatedTime?: number; // in minutes
  actualTimeSpent?: number; // in minutes
  reminderTimes: Date[];
  recurrence?: RecurrenceSettings;
  alarmEnabled: boolean;
  alarmSound?: string;
  lastNotified?: Date;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface TaskFilters {
  status?: Task['status'][];
  priority?: Task['priority'][];
  category?: string[];
  tags?: string[];
  dueDateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  thisWeek: number;
  completionRate: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  task: Task;
  type: 'due-date' | 'reminder' | 'completed';
}

export interface RecurrenceSettings {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // e.g., every 2 days, every 3 weeks, every 1 month
  duration: number; // how many times to repeat (0 = infinite)
  endDate?: Date; // alternative to duration
  daysOfWeek?: number[]; // for weekly: [0,1,2,3,4,5,6] where 0=Sunday
  dayOfMonth?: number; // for monthly: 1-31
}
