import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginCredentials } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Form data
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };

  forgotPasswordEmail = '';

  // UI state
  isLoading = false;
  showPassword = false;
  showForgotPassword = false;
  rememberMe = false;

  // Error handling
  error: string | null = null;
  fieldErrors: { email?: string; password?: string } = {};

  // Success message for forgot password
  forgotPasswordSuccess = false;
  forgotPasswordMessage = '';

  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Load saved email if remember me was checked (only in browser)
    if (this.isBrowser) {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        this.credentials.email = savedEmail;
        this.rememberMe = true;
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // Login
  // ═══════════════════════════════════════════════════════

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        if (response.success) {
          // Handle remember me (only in browser)
          if (this.isBrowser) {
            if (this.rememberMe) {
              localStorage.setItem('rememberedEmail', this.credentials.email);
            } else {
              localStorage.removeItem('rememberedEmail');
            }
          }

          // Redirect based on user role
          this.redirectToDashboard();
        } else {
          this.error = response.message || 'فشل تسجيل الدخول';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.handleLoginError(error);
        this.isLoading = false;
      }
    });
  }

  validateForm(): boolean {
    this.fieldErrors = {};
    let isValid = true;

    // Email validation
    if (!this.credentials.email.trim()) {
      this.fieldErrors.email = 'البريد الإلكتروني مطلوب';
      isValid = false;
    } else if (!this.isValidEmail(this.credentials.email)) {
      this.fieldErrors.email = 'البريد الإلكتروني غير صحيح';
      isValid = false;
    }

    // Password validation
    if (!this.credentials.password) {
      this.fieldErrors.password = 'كلمة المرور مطلوبة';
      isValid = false;
    } else if (this.credentials.password.length < 6) {
      this.fieldErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  handleLoginError(error: any): void {
    if (error.status === 401) {
      this.error = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    } else if (error.status === 403) {
      this.error = 'الحساب معطل. يرجى الاتصال بالمسؤول';
    } else if (error.status === 0) {
      this.error = 'لا يمكن الاتصال بالخادم';
    } else {
      this.error = error.error?.message || 'حدث خطأ أثناء تسجيل الدخول';
    }
  }

  redirectToDashboard(): void {
    const user = this.authService.getCurrentUser();

    if (user?.role === 'admin' || user?.role === 'employee') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  // ═══════════════════════════════════════════════════════
  // Forgot Password
  // ═══════════════════════════════════════════════════════

  openForgotPassword(): void {
    this.showForgotPassword = true;
    this.forgotPasswordEmail = this.credentials.email;
    this.forgotPasswordSuccess = false;
    this.forgotPasswordMessage = '';
    this.error = null;
  }

  closeForgotPassword(): void {
    this.showForgotPassword = false;
    this.forgotPasswordEmail = '';
    this.forgotPasswordSuccess = false;
    this.forgotPasswordMessage = '';
  }

  sendResetLink(): void {
    if (!this.forgotPasswordEmail.trim()) {
      this.error = 'البريد الإلكتروني مطلوب';
      return;
    }

    if (!this.isValidEmail(this.forgotPasswordEmail)) {
      this.error = 'البريد الإلكتروني غير صحيح';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.authService.forgotPassword(this.forgotPasswordEmail).subscribe({
      next: (response) => {
        if (response.success) {
          this.forgotPasswordSuccess = true;
          this.forgotPasswordMessage = response.message || 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني';
        } else {
          this.error = response.message || 'فشل إرسال رابط إعادة التعيين';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Forgot password error:', error);
        if (error.status === 404) {
          this.error = 'البريد الإلكتروني غير مسجل';
        } else {
          this.error = error.error?.message || 'حدث خطأ أثناء إرسال رابط إعادة التعيين';
        }
        this.isLoading = false;
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // UI Helpers
  // ═══════════════════════════════════════════════════════

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  clearError(): void {
    this.error = null;
    this.fieldErrors = {};
  }
}
