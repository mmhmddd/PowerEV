import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  // Form data
  password = '';
  confirmPassword = '';

  // Reset token from URL
  resetToken = '';

  // UI state
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  // Status
  resetSuccess = false;
  error: string | null = null;
  fieldErrors: { password?: string; confirmPassword?: string } = {};

  // Token validation
  tokenValid = false;
  tokenChecking = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get reset token from URL parameters
    this.route.params.subscribe(params => {
      this.resetToken = params['token'];

      if (!this.resetToken) {
        this.error = 'رابط إعادة التعيين غير صحيح';
        this.tokenValid = false;
        this.tokenChecking = false;
      } else {
        // Validate token (optional - you can add a backend endpoint to validate)
        this.validateToken();
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // Token Validation
  // ═══════════════════════════════════════════════════════

  validateToken(): void {
    // For now, just mark as valid
    // You can add a backend endpoint to validate the token
    this.tokenValid = true;
    this.tokenChecking = false;

    // Optional: Call backend to validate token
    // this.authService.validateResetToken(this.resetToken).subscribe({
    //   next: (response) => {
    //     this.tokenValid = response.success;
    //     this.tokenChecking = false;
    //   },
    //   error: (error) => {
    //     this.error = 'الرابط منتهي الصلاحية أو غير صحيح';
    //     this.tokenValid = false;
    //     this.tokenChecking = false;
    //   }
    // });
  }

  // ═══════════════════════════════════════════════════════
  // Reset Password
  // ═══════════════════════════════════════════════════════

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.authService.resetPassword(this.resetToken, this.password).subscribe({
      next: (response) => {
        if (response.success) {
          this.resetSuccess = true;

          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.error = response.message || 'فشل إعادة تعيين كلمة المرور';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Reset password error:', error);
        this.handleResetError(error);
        this.isLoading = false;
      }
    });
  }

  validateForm(): boolean {
    this.fieldErrors = {};
    let isValid = true;

    // Password validation
    if (!this.password) {
      this.fieldErrors.password = 'كلمة المرور مطلوبة';
      isValid = false;
    } else if (this.password.length < 6) {
      this.fieldErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      isValid = false;
    }

    // Confirm password validation
    if (!this.confirmPassword) {
      this.fieldErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
      isValid = false;
    } else if (this.password !== this.confirmPassword) {
      this.fieldErrors.confirmPassword = 'كلمات المرور غير متطابقة';
      isValid = false;
    }

    return isValid;
  }

  handleResetError(error: any): void {
    if (error.status === 400) {
      this.error = 'الرابط منتهي الصلاحية أو غير صحيح';
    } else if (error.status === 404) {
      this.error = 'المستخدم غير موجود';
    } else if (error.status === 0) {
      this.error = 'لا يمكن الاتصال بالخادم';
    } else {
      this.error = error.error?.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور';
    }
  }

  // ═══════════════════════════════════════════════════════
  // UI Helpers
  // ═══════════════════════════════════════════════════════

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  clearError(): void {
    this.error = null;
    this.fieldErrors = {};
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
