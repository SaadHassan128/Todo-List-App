import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User, AuthState } from '../../types/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'todo_app_auth';
  private readonly USERS_KEY = 'todo_app_users';

  // Signals for reactive state management
  private _authState = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null
  });

  // Computed signals for derived state
  public readonly isAuthenticated$ = computed(() => this._authState().isAuthenticated);
  public readonly currentUser$ = computed(() => this._authState().user);
  public readonly loading$ = computed(() => this._authState().loading);
  public readonly error$ = computed(() => this._authState().error);

  constructor(private router: Router) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    try {
      const storedAuth = localStorage.getItem(this.STORAGE_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        const users = this.getUsers();
        const user = users.find(u => u.id === authData.userId);

        if (user && this.isTokenValid(authData.token)) {
          this._authState.set({
            user,
            token: authData.token,
            isAuthenticated: true,
            loading: false,
            error: null
          });
        } else {
          // Token expired or invalid, clear storage
          this.clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.clearAuthData();
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      // Simple token validation - in real app, you'd validate with backend
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  private generateToken(userId: string): string {
    // Simple JWT-like token generation for demo
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa('demo-signature'); // In real app, use proper signing
    return `${header}.${payload}.${signature}`;
  }

  private getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private saveAuthData(userId: string, token: string, rememberMe: boolean = false): void {
    const authData = {
      userId,
      token,
      rememberMe,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._authState.set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  }

  login(emailOrName: string, password: string, rememberMe: boolean = false): Observable<User> {
    this._authState.update(state => ({ ...state, loading: true, error: null }));

    return of(null).pipe(
      map(() => {
        const users = this.getUsers();
        const user = users.find(u =>
          (u.email === emailOrName || u.firstName === emailOrName || u.lastName === emailOrName) &&
          this.verifyPassword(password, u.passwordHash)
        );

        if (!user) {
          throw new Error('Invalid credentials');
        }

        const token = this.generateToken(user.id);
        this.saveAuthData(user.id, token, rememberMe);

        this._authState.set({
          user,
          token,
          isAuthenticated: true,
          loading: false,
          error: null
        });

        return user;
      }),
      catchError(error => {
        this._authState.update(state => ({
          ...state,
          loading: false,
          error: error.message || 'Login failed'
        }));
        return throwError(() => error);
      })
    );
  }

  register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    profilePicture?: string;
  }): Observable<User> {
    this._authState.update(state => ({ ...state, loading: true, error: null }));

    return of(null).pipe(
      map(() => {
        const users = this.getUsers();

        // Check if user already exists
        if (users.some(u => u.email === userData.email)) {
          throw new Error('Email already registered');
        }

        const newUser: User = {
          id: this.generateId(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          passwordHash: this.hashPassword(userData.password),
          profilePicture: userData.profilePicture || '',
          createdAt: new Date(),
          settings: {
            theme: 'auto',
            notifications: {
              enabled: true,
              sound: true,
              dueDateReminders: true,
              overdueAlerts: true,
              achievementNotifications: true,
              quietHours: { start: '22:00', end: '08:00' }
            },
            tasks: {
              defaultView: 'list',
              defaultPriority: 'medium',
              defaultCategory: 'Personal',
              autoArchive: false,
              archiveDays: 30
            },
            workingHours: {
              start: '09:00',
              end: '17:00'
            },
            appearance: {
              accentColor: 'primary',
              fontSize: 'medium',
              viewDensity: 'comfortable'
            }
          }
        };

        users.push(newUser);
        this.saveUsers(users);

        const token = this.generateToken(newUser.id);
        this.saveAuthData(newUser.id, token);

        this._authState.set({
          user: newUser,
          token,
          isAuthenticated: true,
          loading: false,
          error: null
        });

        return newUser;
      }),
      catchError(error => {
        this._authState.update(state => ({
          ...state,
          loading: false,
          error: error.message || 'Registration failed'
        }));
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  updateProfile(updates: Partial<User>): Observable<User> {
    if (!this._authState().user) {
      return throwError(() => new Error('No authenticated user'));
    }

    return of(null).pipe(
      map(() => {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this._authState().user!.id);

        if (userIndex === -1) {
          throw new Error('User not found');
        }

        users[userIndex] = { ...users[userIndex], ...updates };
        this.saveUsers(users);

        this._authState.update(state => ({
          ...state,
          user: users[userIndex]
        }));

        return users[userIndex];
      }),
      catchError(error => throwError(() => error))
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private hashPassword(password: string): string {
    // Simple hash for demo - in real app, use proper hashing
    return btoa(password + 'salt');
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  // Auto logout after 30 minutes of inactivity
  private setupAutoLogout(): void {
    const checkInactivity = () => {
      const authData = localStorage.getItem(this.STORAGE_KEY);
      if (authData) {
        const { loginTime, rememberMe } = JSON.parse(authData);
        const loginDate = new Date(loginTime);
        const now = new Date();

        // Don't auto-logout if remember me is checked
        if (rememberMe) return;

        const minutesSinceLogin = (now.getTime() - loginDate.getTime()) / (1000 * 60);
        if (minutesSinceLogin > 30) {
          this.logout();
        }
      }
    };

    // Check every minute
    setInterval(checkInactivity, 60000);
  }
}
