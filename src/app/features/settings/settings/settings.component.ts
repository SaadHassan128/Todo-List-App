import { Component, computed, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { TaskService } from '../../../shared/services/task.service';
import { OnboardingService } from '../../../shared/services/onboarding';
import { NotificationPopupService } from '../../../shared/services/notification-popup.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  currentUser = computed(() => this.authService.currentUser$());
  
  settingsForm: FormGroup;
  notificationForm: FormGroup;
  taskForm: FormGroup;

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private onboardingService: OnboardingService,
    private notificationPopupService: NotificationPopupService,
    private fb: FormBuilder
  ) {
    this.settingsForm = this.fb.group({
      theme: ['auto'],
      accentColor: ['primary'],
      fontSize: ['medium'],
      viewDensity: ['comfortable']
    });

    this.notificationForm = this.fb.group({
      enabled: [true],
      sound: [true],
      dueDateReminders: [true],
      overdueAlerts: [true],
      achievementNotifications: [true],
      quietHoursEnabled: [false],
      quietHoursStart: ['22:00'],
      quietHoursEnd: ['08:00']
    });

    this.taskForm = this.fb.group({
      defaultView: ['list'],
      defaultPriority: ['medium'],
      defaultCategory: ['Personal'],
      autoArchive: [false],
      archiveDays: [30]
    });
  }

  ngOnInit(): void {
    // Mark settings as visited for onboarding
    this.onboardingService.markSettingsVisited();

    const user = this.currentUser();
    if (user?.settings) {
      this.settingsForm.patchValue({
        theme: user.settings.theme,
        accentColor: user.settings.appearance?.accentColor ?? 'primary',
        fontSize: user.settings.appearance?.fontSize ?? 'medium',
        viewDensity: user.settings.appearance?.viewDensity ?? 'comfortable'
      });

      this.notificationForm.patchValue({
        enabled: user.settings.notifications.enabled,
        sound: user.settings.notifications.sound,
        dueDateReminders: user.settings.notifications.dueDateReminders,
        overdueAlerts: user.settings.notifications.overdueAlerts,
        achievementNotifications: user.settings.notifications.achievementNotifications,
        quietHoursEnabled: false, // stored flag is optional, UI controls quiet hours behaviour
        quietHoursStart: user.settings.notifications.quietHours.start,
        quietHoursEnd: user.settings.notifications.quietHours.end
      });

      this.taskForm.patchValue({
        defaultView: user.settings.tasks.defaultView,
        defaultPriority: user.settings.tasks.defaultPriority,
        defaultCategory: user.settings.tasks.defaultCategory,
        autoArchive: user.settings.tasks.autoArchive,
        archiveDays: user.settings.tasks.archiveDays
      });

      // Apply theme immediately based on saved settings
      this.applyTheme(user.settings.theme);
    }
  }

  saveSettings(): void {
    const user = this.currentUser();
    if (user) {
      const updates = {
        settings: {
          theme: this.settingsForm.value.theme,
          appearance: {
            accentColor: this.settingsForm.value.accentColor,
            fontSize: this.settingsForm.value.fontSize,
            viewDensity: this.settingsForm.value.viewDensity
          },
          notifications: {
            enabled: this.notificationForm.value.enabled,
            sound: this.notificationForm.value.sound,
            dueDateReminders: this.notificationForm.value.dueDateReminders,
            overdueAlerts: this.notificationForm.value.overdueAlerts,
            achievementNotifications: this.notificationForm.value.achievementNotifications,
            quietHours: {
              start: this.notificationForm.value.quietHoursStart,
              end: this.notificationForm.value.quietHoursEnd
            }
          },
          tasks: {
            defaultView: this.taskForm.value.defaultView,
            defaultPriority: this.taskForm.value.defaultPriority,
            defaultCategory: this.taskForm.value.defaultCategory,
            autoArchive: this.taskForm.value.autoArchive,
            archiveDays: this.taskForm.value.archiveDays
          },
          workingHours: user.settings.workingHours
        }
      };

      this.authService.updateProfile(updates).subscribe({
        next: () => {
          this.applyTheme(this.settingsForm.value.theme);
          this.notificationPopupService.show({
            type: 'task-updated',
            title: 'Settings Saved! ⚙️',
            message: 'Your settings have been successfully updated.',
            taskTitle: '',
          });
        },
        error: (err) => {
          this.notificationPopupService.show({
            type: 'task-updated',
            title: 'Error Saving Settings',
            message: 'There was an error saving your settings: ' + err.message,
            taskTitle: '',
          });
        }
      });
    }
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const root = document.documentElement;

    if (theme === 'light') {
      root.classList.remove('dark');
      return;
    }

    if (theme === 'dark') {
      root.classList.add('dark');
      return;
    }

    // Auto: follow system preference
    const prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  exportTasks(): void {
    const tasks = this.taskService.userTasks$();
    const data = {
      tasks,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportTasksCSV(): void {
    const tasks = this.taskService.userTasks$();
    const headers = ['Title', 'Description', 'Category', 'Priority', 'Status', 'Due Date', 'Tags', 'Created At'];
    const rows = tasks.map(task => [
      task.title,
      task.description || '',
      task.category,
      task.priority,
      task.status,
      task.dueDate ? new Date(task.dueDate).toISOString() : '',
      task.tags.join(';'),
      new Date(task.createdAt).toISOString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearCompletedTasks(): void {
    if (confirm('Are you sure you want to clear all completed tasks? This action cannot be undone.')) {
      const tasks = this.taskService.userTasks$();
      const completedTaskIds = tasks.filter(t => t.status === 'completed').map(t => t.id);
      this.taskService.bulkDeleteTasks(completedTaskIds);
      alert('Completed tasks cleared successfully!');
    }
  }

  resetAllData(): void {
    if (confirm('Are you sure you want to reset all data? This will delete all your tasks. This action cannot be undone.')) {
      if (confirm('Type RESET to confirm this action.')) {
        const tasks = this.taskService.userTasks$();
        const allTaskIds = tasks.map(t => t.id);
        this.taskService.bulkDeleteTasks(allTaskIds);
        alert('All data has been reset.');
      }
    }
  }
}
