import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { TaskService } from '../../../shared/services/task.service';

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
  
  profileForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      profilePicture: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture
      });
      this.profilePicturePreview.set(user.profilePicture || null);
    }
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
  }

  cancelEdit(): void {
    this.editMode.set(false);
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture
      });
      this.profilePicturePreview.set(user.profilePicture || null);
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
      const updates = this.profileForm.value;
      this.authService.updateProfile(updates).subscribe({
        next: () => {
          this.editMode.set(false);
          alert('Profile updated successfully!');
        },
        error: (err) => {
          alert('Error updating profile: ' + err.message);
        }
      });
    }
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

  exportData(): void {
    const user = this.currentUser();
    const tasks = this.taskService.userTasks$();
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
