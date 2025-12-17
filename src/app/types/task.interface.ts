export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: Date;
  tags: string[];
  subtasks: SubTask[];
  attachments: Attachment[];
  createdAt: Date;
  completedAt?: Date;
  estimatedTime?: number; // in minutes
  actualTimeSpent?: number; // in minutes
  reminderTimes: Date[];
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
