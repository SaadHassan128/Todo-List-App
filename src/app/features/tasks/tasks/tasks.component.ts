import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskService } from '../../../shared/services/task.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Task, TaskFilters } from '../../../types/task.interface';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe, TitleCasePipe, DragDropModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit {
  viewMode = signal<'list' | 'kanban'>('list');
  showTaskForm = signal(false);
  editingTask = signal<Task | null>(null);
  selectedTasks = signal<Set<string>>(new Set());
  
  searchQuery = signal('');
  filters = signal<TaskFilters>({});
  
  taskForm: FormGroup;
  
  allTasks = computed(() => this.taskService.userTasks$());
  filteredTasks = computed(() => {
    let tasks = this.allTasks();
    const query = this.searchQuery().toLowerCase();
    const filters = this.filters();
    
    if (query) {
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (filters.status?.length) {
      tasks = tasks.filter(task => filters.status!.includes(task.status));
    }
    
    if (filters.priority?.length) {
      tasks = tasks.filter(task => filters.priority!.includes(task.priority));
    }
    
    if (filters.category?.length) {
      tasks = tasks.filter(task => filters.category!.includes(task.category));
    }
    
    return tasks;
  });
  
  listTasks = computed(() => {
    const tasks = this.filteredTasks();
    return {
      todo: tasks.filter(t => t.status === 'todo'),
      inProgress: tasks.filter(t => t.status === 'in-progress'),
      completed: tasks.filter(t => t.status === 'completed')
    };
  });

  categories = ['Work', 'Personal', 'Shopping', 'Health', 'Education', 'Custom'];
  priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
  statuses: Array<'todo' | 'in-progress' | 'completed'> = ['todo', 'in-progress', 'completed'];

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      category: ['Personal', Validators.required],
      priority: ['medium', Validators.required],
      status: ['todo', Validators.required],
      dueDate: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {
    // Check for task ID in route for editing
    const url = this.router.url;
    if (url.includes('/tasks/')) {
      const taskId = url.split('/tasks/')[1];
      const task = this.taskService.getTask(taskId);
      if (task) {
        this.editTask(task);
      }
    }

    // Apply the user's preferred default view (list or kanban) for tasks
    const user = this.authService.currentUser$();
    const defaultView = user?.settings?.tasks?.defaultView;
    if (defaultView === 'kanban') {
      this.viewMode.set('kanban');
    } else {
      this.viewMode.set('list');
    }
  }

  toggleView(): void {
    this.viewMode.update(mode => mode === 'list' ? 'kanban' : 'list');
  }

  openTaskForm(): void {
    this.editingTask.set(null);
    this.taskForm.reset({
      category: 'Personal',
      priority: 'medium',
      status: 'todo'
    });
    this.showTaskForm.set(true);
  }

  closeTaskForm(): void {
    this.showTaskForm.set(false);
    this.editingTask.set(null);
    this.taskForm.reset();
  }

  editTask(task: Task): void {
    this.editingTask.set(task);
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      tags: task.tags.join(', ')
    });
    this.showTaskForm.set(true);
  }

  saveTask(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const tags = formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [];
      
      if (this.editingTask()) {
        // Update existing task
        this.taskService.updateTask(this.editingTask()!.id, {
          title: formValue.title,
          description: formValue.description,
          category: formValue.category,
          priority: formValue.priority,
          status: formValue.status,
          dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
          tags: tags
        });
        
        if (formValue.status === 'completed') {
          this.notificationService.notifyTaskCompleted(formValue.title, this.editingTask()!.id);
        }
      } else {
        // Create new task
        const newTask = this.taskService.createTask({
          title: formValue.title,
          description: formValue.description,
          category: formValue.category,
          priority: formValue.priority,
          status: formValue.status,
          dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
          tags: tags,
          subtasks: [],
          attachments: [],
          reminderTimes: []
        });
        
        this.notificationService.createNotification({
          userId: newTask.userId,
          type: 'system',
          title: 'Task Created',
          message: `Task "${formValue.title}" has been created.`,
          taskId: newTask.id
        });
      }
      
      this.closeTaskForm();
    }
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId);
      this.selectedTasks.update(selected => {
        const newSet = new Set(selected);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }

  toggleTaskSelection(taskId: string): void {
    this.selectedTasks.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }

  toggleSelectAll(): void {
    if (this.selectedTasks().size === this.filteredTasks().length) {
      this.selectedTasks.set(new Set());
    } else {
      this.selectedTasks.set(new Set(this.filteredTasks().map(t => t.id)));
    }
  }

  bulkDelete(): void {
    const selected = Array.from(this.selectedTasks());
    if (selected.length > 0 && confirm(`Are you sure you want to delete ${selected.length} task(s)?`)) {
      this.taskService.bulkDeleteTasks(selected);
      this.selectedTasks.set(new Set());
    }
  }

  bulkUpdateStatus(status: 'todo' | 'in-progress' | 'completed'): void {
    const selected = Array.from(this.selectedTasks());
    if (selected.length > 0) {
      this.taskService.bulkUpdateTasks(selected, { status });
      this.selectedTasks.set(new Set());
    }
  }

  updateTaskStatus(taskId: string, status: 'todo' | 'in-progress' | 'completed'): void {
    const task = this.taskService.getTask(taskId);
    if (task) {
      this.taskService.updateTask(taskId, { status });
      if (status === 'completed') {
        this.notificationService.notifyTaskCompleted(task.title, taskId);
      }
    }
  }

  getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400';
      case 'medium':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      case 'low':
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-400';
    }
  }

  getStatusColor(status: 'todo' | 'in-progress' | 'completed'): string {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'in-progress':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400';
      case 'completed':
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-400';
    }
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  }

  filterByStatus(status: 'todo' | 'in-progress' | 'completed' | null): void {
    if (status === null) {
      this.filters.update(f => ({ ...f, status: undefined }));
    } else {
      this.filters.update(f => ({ ...f, status: [status] }));
    }
  }

  filterByPriority(priority: 'high' | 'medium' | 'low' | null): void {
    if (priority === null) {
      this.filters.update(f => ({ ...f, priority: undefined }));
    } else {
      this.filters.update(f => ({ ...f, priority: [priority] }));
    }
  }

  clearFilters(): void {
    this.filters.set({});
    this.searchQuery.set('');
  }

  // Drag & drop handler for Kanban view using Angular CDK (works on desktop & mobile)
  onTaskDrop(event: CdkDragDrop<Task[]>, status: 'todo' | 'in-progress' | 'completed'): void {
    const task: Task | undefined = event.item.data as Task | undefined;
    if (!task) {
      return;
    }
    
    // Only update if the status actually changed
    if (task.status !== status) {
      this.updateTaskStatus(task.id, status);
    }
  }
}
