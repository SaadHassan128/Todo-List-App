import { Component, computed, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../shared/services/dashboard.service';
import { AuthService } from '../../../shared/services/auth.service';
import { TaskService } from '../../../shared/services/task.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { registerables } from 'chart.js';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser = computed(() => this.authService.currentUser$());
  dashboardStats = computed(() => this.dashboardService.dashboardStats$());
  quickStats = signal<{ title: string; value: number; icon: string; color: string; change: string | null }[]>([]);
  showTasks = signal(false);
  exportFormat = signal<'json' | 'csv'>('json');
  allTasks = computed(() => this.taskService.userTasks$());

  // Chart configurations
  public taskStatusChartData!: ChartData<'doughnut'>;
  public taskStatusChartOptions!: ChartConfiguration<'doughnut'>['options'];
  public taskStatusChartType: 'doughnut' = 'doughnut';

  public weeklyProgressChartData!: ChartData<'bar'>;
  public weeklyProgressChartOptions!: ChartConfiguration<'bar'>['options'];
  public weeklyProgressChartType: 'bar' = 'bar';

  public priorityChartData!: ChartData<'pie'>;
  public priorityChartOptions!: ChartConfiguration<'pie'>['options'];
  public priorityChartType: 'pie' = 'pie';

  public productivityChartData!: ChartData<'line'>;
  public productivityChartOptions!: ChartConfiguration<'line'>['options'];
  public productivityChartType: 'line' = 'line';

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private taskService: TaskService
  ) {
    // Initialize quick stats
    this.quickStats.set(this.dashboardService.getQuickStats());
  }

  ngOnInit(): void {
    // Register Chart.js components
    Chart.register(...registerables);
    
    this.initializeCharts();
    
    // Update charts when stats change using effect
    effect(() => {
      // Access dashboardStats to create dependency
      const stats = this.dashboardStats();
      this.updateCharts();
    });

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      this.updateCharts();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private initializeCharts(): void {
    this.setupTaskStatusChart();
    this.setupWeeklyProgressChart();
    this.setupPriorityChart();
    this.setupProductivityChart();
  }

  private updateCharts(): void {
    this.setupTaskStatusChart();
    this.setupWeeklyProgressChart();
    this.setupPriorityChart();
    this.setupProductivityChart();
    this.quickStats.set(this.dashboardService.getQuickStats());
  }

  private setupTaskStatusChart(): void {
    const stats = this.dashboardStats();
    const todoCount = stats.pending;
    const inProgressCount = stats.total - stats.completed - stats.pending;
    const completedCount = stats.completed;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)';

    this.taskStatusChartData = {
      labels: ['To Do', 'In Progress', 'Completed'],
      datasets: [{
        data: [todoCount, inProgressCount, completedCount],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',  // warning (yellow) for To Do
          'rgba(59, 130, 246, 0.8)',  // primary (blue) for In Progress
          'rgba(34, 197, 94, 0.8)'    // secondary (green) for Completed
        ],
        borderColor: [
          'rgb(245, 158, 11)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)'
        ]
      }]
    };

    this.taskStatusChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            usePointStyle: true,
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: isDark ? 'rgba(75, 85, 99, 1)' : 'rgba(229, 231, 235, 1)',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
  }

  private setupWeeklyProgressChart(): void {
    const weeklyProgress = this.dashboardStats().weeklyProgress;
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    
    this.weeklyProgressChartData = {
      labels: weeklyProgress.map(day => day.date),
      datasets: [
        {
          label: 'Completed',
          data: weeklyProgress.map(day => day.completed),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          borderRadius: 4
        },
        {
          label: 'Total',
          data: weeklyProgress.map(day => day.total),
          backgroundColor: 'rgba(156, 163, 175, 0.5)',
          borderColor: 'rgb(156, 163, 175)',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };

    this.weeklyProgressChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: textColor
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: textColor
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            usePointStyle: true,
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: isDark ? 'rgba(75, 85, 99, 1)' : 'rgba(229, 231, 235, 1)',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value}`;
            }
          }
        }
      }
    };
  }

  private setupPriorityChart(): void {
    const priorityStats = this.dashboardStats().priorityStats;
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)';

    this.priorityChartData = {
      labels: ['High Priority', 'Medium Priority', 'Low Priority'],
      datasets: [{
        data: [priorityStats.high, priorityStats.medium, priorityStats.low],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // danger (red) for High
          'rgba(245, 158, 11, 0.8)',  // warning (yellow) for Medium
          'rgba(34, 197, 94, 0.8)'     // secondary (green) for Low
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)'
        ]
      }]
    };

    this.priorityChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            usePointStyle: true,
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: isDark ? 'rgba(75, 85, 99, 1)' : 'rgba(229, 231, 235, 1)',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
  }

  private setupProductivityChart(): void {
    const weeklyProgress = this.dashboardStats().weeklyProgress;
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    
    // Calculate completion rate for each day
    const completionRates = weeklyProgress.map(day => {
      const rate = day.total > 0 ? (day.completed / day.total) * 100 : 0;
      return Math.round(rate);
    });

    this.productivityChartData = {
      labels: weeklyProgress.map(day => day.date),
      datasets: [{
        label: 'Completion Rate (%)',
        data: completionRates,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    };

    this.productivityChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
            color: textColor
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: textColor
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: isDark ? 'rgba(75, 85, 99, 1)' : 'rgba(229, 231, 235, 1)',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              return `Completion Rate: ${context.parsed.y}%`;
            }
          }
        }
      }
    };
  }

  // Math helper functions for template
  mathMax(a: number, b: number): number {
    return Math.max(a, b);
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  createDemoTask() {
    const demoTasks = [
      {
        title: 'Review project documentation',
        description: 'Go through the project requirements and documentation',
        category: 'Work',
        priority: 'high' as const,
        status: 'todo' as const,
        tags: ['documentation', 'review'],
        subtasks: [],
        attachments: [],
        reminderTimes: []
      },
      {
        title: 'Team meeting preparation',
        description: 'Prepare agenda and materials for the weekly team meeting',
        category: 'Work',
        priority: 'medium' as const,
        status: 'in-progress' as const,
        tags: ['meeting', 'team'],
        subtasks: [
          { id: '1', title: 'Create agenda', completed: true, createdAt: new Date() },
          { id: '2', title: 'Prepare presentation slides', completed: false, createdAt: new Date() }
        ],
        attachments: [],
        reminderTimes: []
      },
      {
        title: 'Grocery shopping',
        description: 'Weekly grocery shopping for the household',
        category: 'Personal',
        priority: 'medium' as const,
        status: 'completed' as const,
        tags: ['shopping', 'personal'],
        subtasks: [],
        attachments: [],
        reminderTimes: []
      }
    ];

    const randomTask = demoTasks[Math.floor(Math.random() * demoTasks.length)];
    this.taskService.createTask(randomTask);
  }

  toggleTasksView(): void {
    this.showTasks.set(!this.showTasks());
  }

  onViewTasksClick(button: HTMLButtonElement): void {
    this.toggleTasksView();
    button.textContent = this.showTasks() ? 'Hide Tasks' : 'View Tasks';
  }

  exportDashboardData(format: 'json' | 'csv' = 'json'): void {
    const stats = this.dashboardStats();
    const tasks = this.allTasks();
    const weeklyProgress = stats.weeklyProgress;
    const priorityStats = stats.priorityStats;

    if (format === 'csv') {
      const lines: string[] = [];

      // Summary stats
      lines.push('Summary Stats');
      lines.push('Total,Completed,Pending,Overdue,Today,This Week,Completion Rate (%)');
      lines.push([
        stats.total,
        stats.completed,
        stats.pending,
        stats.overdue,
        stats.today,
        stats.thisWeek,
        stats.completionRate.toFixed(1)
      ].join(','));
      lines.push('');

      // Weekly progress
      lines.push('Weekly Progress');
      lines.push('Day,Completed,Total');
      weeklyProgress.forEach(day => {
        lines.push([day.date, day.completed, day.total].join(','));
      });
      lines.push('');

      // Priority distribution
      lines.push('Priority Distribution');
      lines.push('Priority,Count');
      lines.push(['High', priorityStats.high].join(','));
      lines.push(['Medium', priorityStats.medium].join(','));
      lines.push(['Low', priorityStats.low].join(','));
      lines.push('');

      // Tasks table
      lines.push('Tasks');
      lines.push('Title,Description,Category,Priority,Status,Due Date,Tags,Created At');
      tasks.forEach(task => {
        const row = [
          `"${task.title}"`,
          `"${task.description || ''}"`,
          `"${task.category}"`,
          `"${task.priority}"`,
          `"${task.status}"`,
          `"${task.dueDate ? new Date(task.dueDate).toISOString() : ''}"`,
          `"${task.tags.join(';')}"`,
          `"${new Date(task.createdAt).toISOString()}"`
        ];
        lines.push(row.join(','));
      });

      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-data-${Date.now()}.csv`
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = {
        stats,
        weeklyProgress,
        priorityStats,
        tasks,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  getMotivationalMessage(): string {
    const stats = this.dashboardStats();
    if (stats.completionRate > 80) {
      return 'Excellent progress! Keep up the great work!';
    }
    if (stats.completionRate > 50) {
      return 'Good progress! You\'re on the right track.';
    }
    if (stats.overdue > 0) {
      return 'Let\'s focus on completing those overdue tasks.';
    }
    return 'Ready to tackle some tasks today?';
  }
}
