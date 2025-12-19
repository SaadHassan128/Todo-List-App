import { Component, OnInit, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-digital-clock',
  standalone: true,
  template: `
    <div class="digital-clock">
      <div class="time">{{ currentTime() }}</div>
      <div class="date">{{ currentDate() }}</div>
    </div>
  `,
  styles: [`
    .digital-clock {
      @apply text-center;
    }

    .time {
      @apply text-2xl font-bold text-gray-900 dark:text-white font-mono;
    }

    .date {
      @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
    }

    @media (max-width: 640px) {
      .time {
        @apply text-xl;
      }

      .date {
        @apply text-xs;
      }
    }
  `]
})
export class DigitalClockComponent implements OnInit, OnDestroy {
  currentTime = signal<string>('00:00:00');
  currentDate = signal<string>('Loading...');
  private intervalId: any;

  ngOnInit(): void {
    this.updateTime();
    // Update every second
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateTime(): void {
    const now = new Date();

    // Format time as HH:MM:SS
    const timeString = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Format date
    const dateString = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.currentTime.set(timeString);
    this.currentDate.set(dateString);
  }
}
