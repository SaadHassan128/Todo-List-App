import { Injectable, signal, computed } from '@angular/core';
import { Task, TaskFilters, TaskStats } from '../../types/task.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly STORAGE_KEY = 'todo_app_tasks';

  // Signals for reactive state management
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Computed signals for derived state
  public readonly tasks$ = this._tasks.asReadonly();
  public readonly loading$ = this._loading.asReadonly();
  public readonly error$ = this._error.asReadonly();

  // Computed stats
  public readonly taskStats$ = computed(() => this.calculateTaskStats());

  // Filtered tasks based on current user
  public readonly userTasks$ = computed(() => {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return [];

    return this._tasks().filter(task => task.userId === currentUser.id);
  });

  constructor(private authService: AuthService) {
    this.initializeTasks();
  }

  private initializeTasks(): void {
    try {
      const storedTasks = localStorage.getItem(this.STORAGE_KEY);
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        // Convert date strings back to Date objects
        const parsedTasks = tasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          reminderTimes: task.reminderTimes?.map((time: string) => new Date(time)) || []
        }));
        this._tasks.set(parsedTasks);
      } else {
        // Initialize with some demo tasks
        this.initializeDemoTasks();
      }
    } catch (error) {
      console.error('Error initializing tasks:', error);
      this.initializeDemoTasks();
    }
  }

  private initializeDemoTasks(): void {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return;

    const demoTasks: Task[] = [
      {
        id: this.generateId(),
        userId: currentUser.id,
        title: 'Welcome to your TODO App!',
        description: 'This is your first task. Start by exploring the features.',
        category: 'Personal',
        priority: 'medium',
        status: 'todo',
        tags: ['welcome', 'tutorial'],
        subtasks: [],
        attachments: [],
        createdAt: new Date(),
        reminderTimes: []
      },
      {
        id: this.generateId(),
        userId: currentUser.id,
        title: 'Complete your profile',
        description: 'Update your profile information and preferences.',
        category: 'Personal',
        priority: 'low',
        status: 'todo',
        tags: ['profile', 'setup'],
        subtasks: [
          { id: this.generateId(), title: 'Upload profile picture', completed: false, createdAt: new Date() },
          { id: this.generateId(), title: 'Set notification preferences', completed: false, createdAt: new Date() }
        ],
        attachments: [],
        createdAt: new Date(),
        reminderTimes: []
      }
    ];

    this._tasks.set(demoTasks);
    this.saveTasks();
  }

  private calculateTaskStats(): TaskStats {
    const userTasks = this.userTasks$();

    const total = userTasks.length;
    const completed = userTasks.filter(task => task.status === 'completed').length;
    const pending = userTasks.filter(task => task.status === 'todo' || task.status === 'in-progress').length;
    const overdue = userTasks.filter(task =>
      task.dueDate &&
      task.dueDate < new Date() &&
      task.status !== 'completed'
    ).length;
    const today = userTasks.filter(task =>
      task.dueDate &&
      task.dueDate.toDateString() === new Date().toDateString()
    ).length;
    const thisWeek = userTasks.filter(task => {
      if (!task.dueDate) return false;
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return task.dueDate >= weekStart && task.dueDate <= weekEnd;
    }).length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      today,
      thisWeek,
      completionRate
    };
  }

  createTask(taskData: Omit<Task, 'id' | 'userId' | 'createdAt'>): Task {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const newTask: Task = {
      ...taskData,
      id: this.generateId(),
      userId: currentUser.id,
      createdAt: new Date()
    };

    this._tasks.update(tasks => [...tasks, newTask]);
    this.saveTasks();

    return newTask;
  }

  updateTask(taskId: string, updates: Partial<Task>): Task | null {
    const taskIndex = this._tasks().findIndex(task => task.id === taskId);
    if (taskIndex === -1) return null;

    const currentUser = this.authService.currentUser$();
    if (!currentUser || this._tasks()[taskIndex].userId !== currentUser.id) {
      return null;
    }

    const updatedTask = {
      ...this._tasks()[taskIndex],
      ...updates,
      completedAt: updates.status === 'completed' && !this._tasks()[taskIndex].completedAt
        ? new Date()
        : this._tasks()[taskIndex].completedAt
    };

    this._tasks.update(tasks => {
      const newTasks = [...tasks];
      newTasks[taskIndex] = updatedTask;
      return newTasks;
    });

    this.saveTasks();
    return updatedTask;
  }

  deleteTask(taskId: string): boolean {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return false;

    const task = this._tasks().find(t => t.id === taskId);
    if (!task || task.userId !== currentUser.id) return false;

    this._tasks.update(tasks => tasks.filter(t => t.id !== taskId));
    this.saveTasks();
    return true;
  }

  getTask(taskId: string): Task | null {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return null;

    return this._tasks().find(task =>
      task.id === taskId && task.userId === currentUser.id
    ) || null;
  }

  getFilteredTasks(filters?: TaskFilters): Task[] {
    let tasks = this.userTasks$();

    if (!filters) return tasks;

    if (filters.status?.length) {
      tasks = tasks.filter(task => filters.status!.includes(task.status));
    }

    if (filters.priority?.length) {
      tasks = tasks.filter(task => filters.priority!.includes(task.priority));
    }

    if (filters.category?.length) {
      tasks = tasks.filter(task => filters.category!.includes(task.category));
    }

    if (filters.tags?.length) {
      tasks = tasks.filter(task =>
        filters.tags!.some(tag => task.tags.includes(tag))
      );
    }

    if (filters.dueDateRange) {
      tasks = tasks.filter(task =>
        task.dueDate &&
        task.dueDate >= filters.dueDateRange!.start &&
        task.dueDate <= filters.dueDateRange!.end
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return tasks;
  }

  private saveTasks(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._tasks()));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Bulk operations
  bulkUpdateTasks(taskIds: string[], updates: Partial<Task>): number {
    let updatedCount = 0;

    this._tasks.update(tasks => {
      return tasks.map(task => {
        if (taskIds.includes(task.id) && task.userId === this.authService.currentUser$()?.id) {
          updatedCount++;
          return {
            ...task,
            ...updates,
            completedAt: updates.status === 'completed' && !task.completedAt
              ? new Date()
              : task.completedAt
          };
        }
        return task;
      });
    });

    if (updatedCount > 0) {
      this.saveTasks();
    }

    return updatedCount;
  }

  bulkDeleteTasks(taskIds: string[]): number {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return 0;

    let deletedCount = 0;

    this._tasks.update(tasks => {
      const filteredTasks = tasks.filter(task => {
        if (taskIds.includes(task.id) && task.userId === currentUser.id) {
          deletedCount++;
          return false;
        }
        return true;
      });
      return filteredTasks;
    });

    if (deletedCount > 0) {
      this.saveTasks();
    }

    return deletedCount;
  }
}
