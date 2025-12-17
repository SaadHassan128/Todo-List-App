import { Component, computed, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { TaskService } from '../../../shared/services/task.service';

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
    const user = this.currentUser();
    if (user?.settings) {
      this.settingsForm.patchValue({
        theme: user.settings.theme,
        accentColor: 'primary',
        fontSize: 'medium',
        viewDensity: 'comfortable'
      });

      this.notificationForm.patchValue({
        enabled: user.settings.notifications.enabled,
        sound: user.settings.notifications.sound,
        dueDateReminders: true,
        overdueAlerts: true,
        achievementNotifications: true,
        quietHoursEnabled: false,
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
    }
  }

  saveSettings(): void {
    const user = this.currentUser();
    if (user) {
      const updates = {
        settings: {
          theme: this.settingsForm.value.theme,
          notifications: {
            enabled: this.notificationForm.value.enabled,
            sound: this.notificationForm.value.sound,
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
          alert('Settings saved successfully!');
        },
        error: (err) => {
          alert('Error saving settings: ' + err.message);
        }
      });
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
