import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  profilePicturePreview = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z\s]+$/)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z\s]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)]],
      confirmPassword: ['', [Validators.required]],
      profilePicture: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value ? null : { mismatch: true };
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        this.error.set('Profile picture must be less than 2MB');
        return;
      }

      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        this.error.set('Only JPG and PNG files are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicturePreview.set(reader.result as string);
        this.registerForm.patchValue({ profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading.set(true);
      this.error.set(null);

      const formData = this.registerForm.value;

      this.authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        profilePicture: formData.profilePicture
      }).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword.update(show => !show);
    } else {
      this.showConfirmPassword.update(show => !show);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} must be at most ${control.errors['maxlength'].requiredLength} characters`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['pattern']) {
        if (fieldName === 'password') {
          return 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character';
        }
        if (fieldName.includes('Name')) {
          return 'Name can only contain letters and spaces';
        }
        if (fieldName === 'phone') {
          return 'Please enter a valid phone number with country code';
        }
      }
    }

    // Check form-level errors
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['mismatch']) {
      return 'Passwords do not match';
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }

  getPasswordStrength(): { level: string; color: string; percentage: number } {
    const password = this.registerForm.get('password')?.value || '';
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    const percentage = (score / 5) * 100;

    if (score <= 2) return { level: 'Weak', color: 'danger', percentage };
    if (score <= 3) return { level: 'Medium', color: 'warning', percentage };
    return { level: 'Strong', color: 'secondary', percentage };
  }
}
