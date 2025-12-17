export interface AppNotification {
  id: string;
  userId: string;
  type: 'due-date' | 'reminder' | 'overdue' | 'system' | 'achievement';
  title: string;
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  types: {
    dueDate: boolean;
    reminder: boolean;
    overdue: boolean;
    achievement: boolean;
  };
  sound: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface ReminderRule {
  id: string;
  taskId: string;
  type: 'before-due' | 'at-due' | 'custom';
  offset?: number; // minutes before due date
  time?: Date; // specific time
  enabled: boolean;
}
