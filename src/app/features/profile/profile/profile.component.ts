import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { TaskService } from '../../../shared/services/task.service';
import { OnboardingService } from '../../../shared/services/onboarding';
import { ConfirmationDialogService } from '../../../shared/services/confirmation-dialog.service';
import { NotificationPopupService } from '../../../shared/services/notification-popup.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  currentUser = computed(() => this.authService.currentUser$());
  userStats = computed(() => this.taskService.taskStats$());
  
  editMode = signal(false);
  showPasswordForm = signal(false);
  profilePicturePreview = signal<string | null>(null);
  showCustomRole = signal(false);

  // Predefined role options
  roleOptions = [
    'Student',
    'Instructor',
    'Engineer',
    'Doctor',
    'Artist',
    'CEO',
    'CTO',
    'Manager',
    'Designer',
    'Developer',
    'Teacher',
    'Researcher',
    'Entrepreneur',
    'Consultant',
    'Custom'
  ];
  
  profileForm: FormGroup;
  passwordForm: FormGroup;

  exportFormat = signal<'json' | 'csv'>('json');

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private onboardingService: OnboardingService,
    private confirmationDialogService: ConfirmationDialogService,
    private notificationPopupService: NotificationPopupService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      profilePicture: [''],
      gender: [''],
      dateOfBirth: [''],
      role: [''],
      customRole: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Initially disable all form controls (read-only mode)
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.disable();
    });
  }

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? this.formatDateForInput(user.dateOfBirth) : ''
      });
      this.profilePicturePreview.set(user.profilePicture || null);
    }
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');
    return newPassword && confirmPassword && newPassword.value === confirmPassword.value
      ? null
      : { mismatch: true };
  }

  enableEditMode(): void {
    this.editMode.set(true);

    // Enable all form controls
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.enable();
    });

    // Initialize form with current user data
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? this.formatDateForInput(user.dateOfBirth) : '',
        role: user.role || '',
        customRole: ''
      });
      this.profilePicturePreview.set(user.profilePicture || null);

      // Check if role is custom and show custom field
      if (user.role && !this.roleOptions.includes(user.role) && user.role !== 'Custom') {
        this.showCustomRole.set(true);
        this.profileForm.get('role')?.setValue('Custom');
        this.profileForm.get('customRole')?.setValue(user.role);
      }
    }
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.showCustomRole.set(false);

    // Disable all form controls
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.disable();
    });

    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '',
        role: user.role || '',
        customRole: ''
      });
      this.profilePicturePreview.set(user.profilePicture || null);

      // Check if role is custom and show custom field
      if (user.role && !this.roleOptions.includes(user.role) && user.role !== 'Custom') {
        this.showCustomRole.set(true);
        this.profileForm.get('role')?.setValue('Custom');
        this.profileForm.get('customRole')?.setValue(user.role);
      }
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Profile picture must be less than 2MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert('Only JPG and PNG files are allowed');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicturePreview.set(reader.result as string);
        this.profileForm.patchValue({ profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;

      // Convert dateOfBirth string to Date object if provided and handle role
      const updates = {
        ...formValue,
        dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth) : undefined,
        role: this.getSelectedRole()
      };

      // Remove customRole from updates as it's not part of the User interface
      delete updates.customRole;

      this.authService.updateProfile(updates).subscribe({
        next: () => {
          this.editMode.set(false);

          // Mark profile as completed in onboarding
          this.onboardingService.markProfileCompleted();

          // Show success notification
          this.notificationPopupService.show({
            type: 'task-updated',
            title: 'Profile Updated! 🎉',
            message: 'Your profile has been successfully updated.',
            taskTitle: '',
          });

          // Check if we should prompt for settings visit
          if (this.onboardingService.shouldPromptSettingsVisit()) {
            setTimeout(() => this.promptSettingsVisit(), 500);
          }
        },
        error: (err) => {
          alert('Error updating profile: ' + err.message);
        }
      });
    }
  }

  private async promptSettingsVisit(): Promise<void> {
    const confirmed = await this.confirmationDialogService.show({
      title: 'Profile Complete! 🎉',
      message: 'Great! Your profile is now complete. Would you like to visit Settings to customize your experience?',
      confirmText: 'Go to Settings',
      cancelText: 'Maybe Later',
      type: 'info'
    });

    if (confirmed) {
      this.onboardingService.markSettingsVisited();
      this.router.navigate(['/settings']);
    } else {
      alert('Profile updated successfully! You can visit Settings anytime to customize your experience.');
    }
  }

  onRoleChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedRole = selectElement.value;

    if (selectedRole === 'Custom') {
      this.showCustomRole.set(true);
      this.profileForm.get('customRole')?.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(50)]);
    } else {
      this.showCustomRole.set(false);
      this.profileForm.get('customRole')?.clearValidators();
      this.profileForm.get('customRole')?.setValue('');
    }
    this.profileForm.get('customRole')?.updateValueAndValidity();
  }

  getSelectedRole(): string {
    const role = this.profileForm.get('role')?.value;
    const customRole = this.profileForm.get('customRole')?.value;

    if (role === 'Custom' && customRole) {
      return customRole;
    }
    return role || '';
  }

  openPasswordForm(): void {
    this.showPasswordForm.set(true);
    this.passwordForm.reset();
  }

  closePasswordForm(): void {
    this.showPasswordForm.set(false);
    this.passwordForm.reset();
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      // In a real app, you'd verify current password and update
      alert('Password change functionality would be implemented here');
      this.closePasswordForm();
    }
  }

  exportData(format: 'json' | 'csv' = 'json'): void {
    const user = this.currentUser();
    const tasks = this.taskService.userTasks$();

    if (format === 'csv') {
      // Export tasks as CSV
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
      a.download = `todo-app-data-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Default JSON export (includes user and tasks)
      const data = {
        user,
        tasks,
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todo-app-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('This will permanently delete all your data. Type DELETE to confirm.')) {
        // In a real app, you'd call an API to delete the account
        alert('Account deletion would be implemented here');
        this.authService.logout();
      }
    }
  }
}
