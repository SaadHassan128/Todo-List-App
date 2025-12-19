import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskService } from '../../../shared/services/task.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { NotificationPopupService } from '../../../shared/services/notification-popup.service';
import { ConfirmationDialogService } from '../../../shared/services/confirmation-dialog.service';
import { Task, TaskFilters } from '../../../types/task.interface';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    TitleCasePipe,
    DragDropModule,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
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
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filters.status?.length) {
      tasks = tasks.filter((task) => filters.status!.includes(task.status));
    }

    if (filters.priority?.length) {
      tasks = tasks.filter((task) => filters.priority!.includes(task.priority));
    }

    if (filters.category?.length) {
      tasks = tasks.filter((task) => filters.category!.includes(task.category));
    }

    // Sort by priority: high -> medium -> low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  });

  listTasks = computed(() => {
    const tasks = this.filteredTasks();
    return {
      todo: tasks.filter((t) => t.status === 'todo'),
      inProgress: tasks.filter((t) => t.status === 'in-progress'),
      completed: tasks.filter((t) => t.status === 'completed'),
    };
  });

  categories = ['Work', 'Personal', 'Shopping', 'Health', 'Education', 'Custom'];
  priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
  statuses: Array<'todo' | 'in-progress' | 'completed'> = ['todo', 'in-progress', 'completed'];

  // Connected drop lists for Kanban drag & drop
  kanbanDropLists = ['todo-list', 'inprogress-list', 'completed-list'];

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private notificationPopupService: NotificationPopupService,
    private confirmationDialogService: ConfirmationDialogService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      category: ['Personal', Validators.required],
      priority: ['medium', Validators.required],
      status: ['todo', Validators.required],
      dueDate: [''],
      dueTime: [''],
      tags: [''],
      recurrenceEnabled: [false],
      recurrenceType: ['daily'],
      recurrenceInterval: [1],
      recurrenceDuration: [0], // 0 = infinite
      recurrenceEndDate: [''],
      recurrenceDaysOfWeek: [[]],
      alarmEnabled: [false],
      alarmSound: ['default'],
    });
  }

  ngOnInit(): void {
    // Check for filter query parameter from dashboard
    this.route.queryParams.subscribe(params => {
      const filter = params['filter'];
      if (filter) {
        this.applyDashboardFilter(filter);
      }
    });

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
    this.viewMode.update((mode) => (mode === 'list' ? 'kanban' : 'list'));
  }

  openTaskForm(): void {
    this.editingTask.set(null);
    this.taskForm.reset({
      category: 'Personal',
      priority: 'medium',
      status: 'todo',
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
      dueTime: task.dueTime || '',
      tags: task.tags.join(', '),
      recurrenceEnabled: !!task.recurrence,
      recurrenceType: task.recurrence?.type || 'daily',
      recurrenceInterval: task.recurrence?.interval || 1,
      recurrenceDuration: task.recurrence?.duration || 0,
      recurrenceEndDate: task.recurrence?.endDate
        ? new Date(task.recurrence.endDate).toISOString().split('T')[0]
        : '',
      recurrenceDaysOfWeek: task.recurrence?.daysOfWeek || [],
      alarmEnabled: task.alarmEnabled || false,
      alarmSound: task.alarmSound || 'default',
    });
    this.showTaskForm.set(true);
  }

  saveTask(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const tags = formValue.tags
        ? formValue.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t)
        : [];

      // Build recurrence settings
      let recurrence = undefined;
      if (formValue.recurrenceEnabled) {
        recurrence = {
          type: formValue.recurrenceType,
          interval: formValue.recurrenceInterval || 1,
          duration: formValue.recurrenceDuration || 0,
          endDate: formValue.recurrenceEndDate ? new Date(formValue.recurrenceEndDate) : undefined,
          daysOfWeek:
            formValue.recurrenceType === 'weekly' ? formValue.recurrenceDaysOfWeek : undefined,
          dayOfMonth:
            formValue.recurrenceType === 'monthly' ? formValue.recurrenceDayOfMonth : undefined,
        };
      }

      const taskData = {
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        priority: formValue.priority,
        status: formValue.status,
        dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
        dueTime: formValue.dueTime || undefined,
        tags: tags,
        subtasks: [],
        attachments: [],
        reminderTimes: [],
        recurrence,
        alarmEnabled: formValue.alarmEnabled || false,
        alarmSound: formValue.alarmSound || 'default',
      };

      if (this.editingTask()) {
        // Update existing task
        const oldTask = this.editingTask()!;
        this.taskService.updateTask(oldTask.id, taskData);

        // Show popup notifications for changes
        if (oldTask.priority !== taskData.priority) {
          this.notificationPopupService.showPriorityChanged(
            taskData.title,
            oldTask.priority,
            taskData.priority
          );
        }
        if (oldTask.status !== taskData.status) {
          this.notificationPopupService.showStatusChanged(
            taskData.title,
            this.getStatusLabel(oldTask.status),
            this.getStatusLabel(taskData.status)
          );

          // Create notification for status change
          this.notificationService.createNotification({
            userId: oldTask.userId,
            type: 'system',
            title: 'Task Status Updated',
            message: `Task "${taskData.title}" status changed from ${this.getStatusLabel(
              oldTask.status
            )} to ${this.getStatusLabel(taskData.status)}`,
            taskId: oldTask.id,
          });

          // Handle completion notification
          if (taskData.status === 'completed') {
            this.notificationService.notifyTaskCompleted(taskData.title, oldTask.id);
            this.notificationPopupService.showTaskCompleted(taskData.title);
          }
        }
      } else {
        // Create new task
        const newTask = this.taskService.createTask(taskData);

        // Generate recurring tasks if needed
        if (recurrence) {
          const recurringTasks = this.taskService.generateRecurringTasks(newTask);
          recurringTasks.forEach((recurringTask) => {
            this.taskService.createTask(recurringTask);
          });
        }

        // Show popup notification
        this.notificationPopupService.showTaskCreated(formValue.title);

        this.notificationService.createNotification({
          userId: newTask.userId,
          type: 'system',
          title: 'Task Created',
          message: `Task "${formValue.title}" has been created.`,
          taskId: newTask.id,
        });
      }

      this.closeTaskForm();
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    const task = this.taskService.getTask(taskId);
    if (!task) return;

    const confirmed = await this.confirmationDialogService.show({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      this.taskService.deleteTask(taskId);

      // Remove from selected tasks
      this.selectedTasks.update((selected) => {
        const newSet = new Set(selected);
        newSet.delete(taskId);
        return newSet;
      });

      // Show success popup
      setTimeout(() => {
        this.notificationPopupService.showTaskDeleted(task.title);
      }, 200);
    }
  }

  toggleTaskSelection(taskId: string): void {
    this.selectedTasks.update((selected) => {
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
      this.selectedTasks.set(new Set(this.filteredTasks().map((t) => t.id)));
    }
  }

  async bulkDelete(): Promise<void> {
    const selected = Array.from(this.selectedTasks());
    if (selected.length === 0) return;

    const confirmed = await this.confirmationDialogService.show({
      title: 'Delete Tasks',
      message: `Are you sure you want to delete ${selected.length} task${selected.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete Tasks',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      const deletedCount = this.taskService.bulkDeleteTasks(selected);
      this.selectedTasks.set(new Set());

      // Show success popup
      setTimeout(() => {
        this.notificationPopupService.showTasksDeleted(deletedCount);
      }, 200);
    }
  }

  bulkUpdateStatus(status: 'todo' | 'in-progress' | 'completed'): void {
    const selected = Array.from(this.selectedTasks());
    if (selected.length > 0) {
      this.taskService.bulkUpdateTasks(selected, { status });
      this.selectedTasks.set(new Set());
    }
  }

  async updateTaskStatus(
    taskId: string,
    newStatus: 'todo' | 'in-progress' | 'completed'
  ): Promise<void> {
    const task = this.taskService.getTask(taskId);
    if (!task) return;

    // Determine if we need confirmation
    const needsConfirmation = this.shouldShowConfirmation(task.status, newStatus);

    if (needsConfirmation) {
      const confirmed = await this.showStatusChangeConfirmation(task, newStatus);
      if (!confirmed) return;
    }

    // Update the task status
    this.taskService.updateTask(taskId, { status: newStatus });

    // Create notification for status change
    this.notificationService.createNotification({
      userId: task.userId,
      type: 'system',
      title: 'Task Status Updated',
      message: `Task "${task.title}" status changed from ${this.getStatusLabel(
        task.status
      )} to ${this.getStatusLabel(newStatus)}`,
      taskId: task.id,
    });

    // Handle completion notification
    if (newStatus === 'completed') {
      this.notificationService.notifyTaskCompleted(task.title, taskId);
      // Show congratulatory popup with a small delay
      setTimeout(() => {
        this.notificationPopupService.showTaskCompleted(task.title);
      }, 300);
    }

    // Always show status change notification popup
    setTimeout(() => {
      this.showStatusChangeNotification(task, newStatus);
    }, 200);
  }

  private shouldShowConfirmation(currentStatus: string, newStatus: string): boolean {
    // Show confirmation when:
    // 1. Moving from 'todo' to 'in-progress' or 'completed'
    // 2. Moving from 'in-progress' to 'completed'
    // 3. Moving from 'completed' back to 'in-progress' or 'todo'
    return (
      (currentStatus === 'todo' && (newStatus === 'in-progress' || newStatus === 'completed')) ||
      (currentStatus === 'in-progress' && newStatus === 'completed') ||
      (currentStatus === 'completed' && (newStatus === 'in-progress' || newStatus === 'todo'))
    );
  }

  private async showStatusChangeConfirmation(task: any, newStatus: string): Promise<boolean> {
    const statusLabels = {
      todo: 'To Do',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };

    const currentLabel = statusLabels[task.status as keyof typeof statusLabels];
    const newLabel = statusLabels[newStatus as keyof typeof statusLabels];

    return await this.confirmationDialogService.show({
      title: 'Confirm Status Change',
      message: `Are you sure you want to change "${task.title}" from ${currentLabel} to ${newLabel}?`,
      confirmText: 'Yes, Change Status',
      cancelText: 'Cancel',
      type: newStatus === 'completed' ? 'success' : 'warning',
    });
  }

  private showStatusChangeNotification(task: any, newStatus: string): void {
    const statusLabels = {
      todo: 'To Do',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };

    const oldLabel = statusLabels[task.status as keyof typeof statusLabels];
    const newLabel = statusLabels[newStatus as keyof typeof statusLabels];

    this.notificationPopupService.showStatusChanged(task.title, oldLabel, newLabel);
  }

  private getStatusLabel(status: string): string {
    const statusLabels = {
      todo: 'To Do',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
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
      this.filters.update((f) => ({ ...f, status: undefined }));
    } else {
      this.filters.update((f) => ({ ...f, status: [status] }));
    }
  }

  filterByPriority(priority: 'high' | 'medium' | 'low' | null): void {
    if (priority === null) {
      this.filters.update((f) => ({ ...f, priority: undefined }));
    } else {
      this.filters.update((f) => ({ ...f, priority: [priority] }));
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

  onDayOfWeekChange(event: any, dayIndex: number): void {
    const daysOfWeek = this.taskForm.get('recurrenceDaysOfWeek')?.value || [];
    if (event.target.checked) {
      if (!daysOfWeek.includes(dayIndex)) {
        daysOfWeek.push(dayIndex);
      }
    } else {
      const index = daysOfWeek.indexOf(dayIndex);
      if (index > -1) {
        daysOfWeek.splice(index, 1);
      }
    }
    this.taskForm.patchValue({ recurrenceDaysOfWeek: daysOfWeek });
  }

  isDaySelected(dayIndex: number): boolean {
    const daysOfWeek = this.taskForm.get('recurrenceDaysOfWeek')?.value || [];
    return daysOfWeek.includes(dayIndex);
  }

  getRecurrenceLabel(recurrence: any): string {
    if (!recurrence) return '';

    const interval = recurrence.interval || 1;
    const type = recurrence.type;

    switch (type) {
      case 'daily':
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case 'weekly':
        if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
          return 'Weekly (custom)';
        }
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case 'monthly':
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      default:
        return '';
    }
  }

  private applyDashboardFilter(filter: string): void {
    switch (filter) {
      case 'completed':
        // Filter to show only completed tasks
        this.viewMode.set('list');
        // You could set a filter signal here if you want to persist the filter
        // For now, we'll just switch to list view and let the user see all tasks
        // The filtering logic would need to be implemented in the template
        break;
      case 'in-progress':
        this.viewMode.set('list');
        break;
      case 'overdue':
        this.viewMode.set('list');
        break;
      default:
        // No specific filter, show all tasks
        break;
    }

    // Show a notification that the filter has been applied
    this.notificationPopupService.show({
      type: 'task-updated',
      title: 'Tasks Filtered',
      message: `Showing ${filter.replace('-', ' ')} tasks`,
      taskTitle: '',
    });
  }
}
