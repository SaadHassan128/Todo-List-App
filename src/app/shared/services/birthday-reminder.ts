import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { NotificationPopupService } from './notification-popup.service';

@Injectable({
  providedIn: 'root',
})
export class BirthdayReminderService implements OnDestroy {
  private checkInterval: any;
  private readonly CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour

  constructor(
    private authService: AuthService,
    private notificationPopupService: NotificationPopupService
  ) {
    this.startBirthdayChecking();
  }

  private startBirthdayChecking(): void {
    // Check immediately
    this.checkForBirthday();

    // Then check every hour
    this.checkInterval = setInterval(() => {
      this.checkForBirthday();
    }, this.CHECK_INTERVAL);
  }

  private checkForBirthday(): void {
    const user = this.authService.currentUser$();
    if (!user || !user.dateOfBirth) return;

    const today = new Date();
    const birthDate = new Date(user.dateOfBirth);

    // Check if today is the user's birthday
    if (today.getDate() === birthDate.getDate() &&
        today.getMonth() === birthDate.getMonth()) {

      // Check if we already showed the birthday message today
      const lastShown = localStorage.getItem(`birthday_shown_${user.id}`);
      const todayKey = today.toDateString();

      if (lastShown !== todayKey) {
        this.showBirthdayMessage(user.firstName);
        localStorage.setItem(`birthday_shown_${user.id}`, todayKey);
      }
    }
  }

  private showBirthdayMessage(firstName: string): void {
    const birthdayMessages = [
      `🎂 Happy Birthday, ${firstName}! Wishing you a fantastic year ahead filled with success and joy!`,
      `🎉 Happy Birthday, ${firstName}! May your special day be as amazing as you are!`,
      `🥳 Happy Birthday, ${firstName}! Hope your birthday is filled with love, laughter, and all your favorite things!`,
      `🎈 Happy Birthday, ${firstName}! Another year wiser, another year better! Enjoy your special day!`,
      `🎊 Happy Birthday, ${firstName}! May all your dreams and wishes come true this year!`
    ];

    const randomMessage = birthdayMessages[Math.floor(Math.random() * birthdayMessages.length)];

    this.notificationPopupService.show({
      type: 'task-completed', // Using celebration icon
      title: '🎂 Happy Birthday!',
      message: randomMessage,
      taskTitle: '',
    });
  }

  // Method to manually trigger birthday check (useful for testing)
  checkBirthdayNow(): void {
    this.checkForBirthday();
  }

  // Clean up interval when service is destroyed
  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}
