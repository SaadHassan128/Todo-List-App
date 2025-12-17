import { Injectable, computed, signal } from '@angular/core';
import { TaskService } from './task.service';
import { DashboardStats, ChartData } from '../../types/app.interface';
import { Task } from '../../types/task.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private taskService: TaskService) {}

  // Computed dashboard stats based on current tasks
  public readonly dashboardStats$ = computed(() => {
    const stats = this.taskService.taskStats$();
    const userTasks = this.taskService.userTasks$();

    // Calculate weekly progress (last 7 days)
    const weeklyProgress = this.calculateWeeklyProgress(userTasks);

    // Calculate category stats
    const categoryStats = this.calculateCategoryStats(userTasks);

    // Calculate priority stats
    const priorityStats = this.calculatePriorityStats(userTasks);

    return {
      ...stats,
      weeklyProgress,
      categoryStats,
      priorityStats
    } as DashboardStats;
  });

  // Chart data for task status distribution (simplified for now)
  public readonly taskStatusChart$ = computed(() => {
    const userTasks = this.taskService.userTasks$();
    return {
      todo: userTasks.filter(t => t.status === 'todo').length,
      'in-progress': userTasks.filter(t => t.status === 'in-progress').length,
      completed: userTasks.filter(t => t.status === 'completed').length
    };
  });

  // Chart data for weekly productivity (simplified for now)
  public readonly weeklyProductivityChart$ = computed(() => {
    return this.dashboardStats$().weeklyProgress;
  });

  // Chart data for priority distribution (simplified for now)
  public readonly priorityChart$ = computed(() => {
    return this.dashboardStats$().priorityStats;
  });

  private calculateWeeklyProgress(tasks: Task[]) {
    const weeklyProgress = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toLocaleDateString('en-US', { weekday: 'short' });

      const dayTasks = tasks.filter(task => {
        const taskDate = task.createdAt;
        return taskDate.toDateString() === date.toDateString();
      });

      const completedTasks = dayTasks.filter(task => task.status === 'completed').length;
      const totalTasks = dayTasks.length;

      weeklyProgress.push({
        date: dateString,
        completed: completedTasks,
        total: totalTasks
      });
    }

    return weeklyProgress;
  }

  private calculateCategoryStats(tasks: Task[]) {
    const categoryMap = new Map<string, { count: number; completed: number }>();

    tasks.forEach(task => {
      const category = task.category;
      const current = categoryMap.get(category) || { count: 0, completed: 0 };

      categoryMap.set(category, {
        count: current.count + 1,
        completed: current.completed + (task.status === 'completed' ? 1 : 0)
      });
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      completed: stats.completed
    }));
  }

  private calculatePriorityStats(tasks: Task[]) {
    return {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };
  }

  // Quick stats for dashboard cards
  public getQuickStats() {
    const stats = this.dashboardStats$();

    return [
      {
        title: 'Total Tasks',
        value: stats.total,
        icon: '📋',
        color: 'blue',
        change: null
      },
      {
        title: 'Completed',
        value: stats.completed,
        icon: '✅',
        color: 'green',
        change: stats.total > 0 ? `${((stats.completed / stats.total) * 100).toFixed(1)}%` : '0%'
      },
      {
        title: 'In Progress',
        value: stats.pending,
        icon: '⏳',
        color: 'yellow',
        change: null
      },
      {
        title: 'Overdue',
        value: stats.overdue,
        icon: '⚠️',
        color: 'red',
        change: null
      }
    ];
  }
}
