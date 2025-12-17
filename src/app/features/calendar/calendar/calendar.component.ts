import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { TaskService } from '../../../shared/services/task.service';
import { Task } from '../../../types/task.interface';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent {
  currentDate = signal(new Date());
  viewMode = signal<'month' | 'week' | 'day'>('month');
  selectedDate = signal<Date | null>(null);
  showTaskModal = signal(false);
  selectedDateTasks = signal<Task[]>([]);

  allTasks = computed(() => this.taskService.userTasks$());

  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<{ date: Date; tasks: Task[]; isCurrentMonth: boolean; isToday: boolean }> = [];
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date: dayDate,
        tasks: this.getTasksForDate(dayDate),
        isCurrentMonth: false,
        isToday: this.isToday(dayDate)
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      days.push({
        date: dayDate,
        tasks: this.getTasksForDate(dayDate),
        isCurrentMonth: true,
        isToday: this.isToday(dayDate)
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const dayDate = new Date(year, month + 1, day);
      days.push({
        date: dayDate,
        tasks: this.getTasksForDate(dayDate),
        isCurrentMonth: false,
        isToday: this.isToday(dayDate)
      });
    }
    
    return days;
  });

  weekDays = computed(() => {
    const date = this.currentDate();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  });

  monthName = computed(() => {
    return this.currentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  constructor(private taskService: TaskService) {}

  getTasksForDate(date: Date): Task[] {
    return this.allTasks().filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  previousMonth(): void {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() - 1);
    this.currentDate.set(date);
  }

  nextMonth(): void {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + 1);
    this.currentDate.set(date);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
    this.selectedDateTasks.set(this.getTasksForDate(date));
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
    this.selectedDate.set(null);
  }

  getTaskCountForDate(date: Date): number {
    return this.getTasksForDate(date).length;
  }

  getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return 'bg-danger-500';
      case 'medium':
        return 'bg-warning-500';
      case 'low':
        return 'bg-secondary-500';
    }
  }

  getStatusColor(status: 'todo' | 'in-progress' | 'completed'): string {
    switch (status) {
      case 'todo':
        return 'bg-gray-400';
      case 'in-progress':
        return 'bg-primary-500';
      case 'completed':
        return 'bg-secondary-500';
    }
  }
}
