export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash: string;
  profilePicture: string; // base64
  createdAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    enabled: boolean;
    sound: boolean;
    quietHours: {
      start: string; // HH:MM
      end: string;   // HH:MM
    };
  };
  tasks: {
    defaultView: 'list' | 'kanban' | 'calendar';
    defaultPriority: 'high' | 'medium' | 'low';
    defaultCategory: string;
    autoArchive: boolean;
    archiveDays: number;
  };
  workingHours: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
