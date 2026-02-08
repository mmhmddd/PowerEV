// src/app/core/services/toast.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  public toast$ = this.toastSubject.asObservable();

  /**
   * Show success toast
   * @param message - Main message to display
   * @param title - Optional title (default: 'نجح!')
   * @param duration - Optional duration in ms (default: 3000)
   */
  success(message: string, title: string = 'نجح!', duration: number = 3000): void {
    this.show({
      id: this.generateId(),
      type: 'success',
      message,
      title,
      duration
    });
  }

  /**
   * Show error toast
   * @param message - Main message to display
   * @param title - Optional title (default: 'خطأ!')
   * @param duration - Optional duration in ms (default: 4000)
   */
  error(message: string, title: string = 'خطأ!', duration: number = 4000): void {
    this.show({
      id: this.generateId(),
      type: 'error',
      message,
      title,
      duration
    });
  }

  /**
   * Show warning toast
   * @param message - Main message to display
   * @param title - Optional title (default: 'تحذير!')
   * @param duration - Optional duration in ms (default: 3500)
   */
  warning(message: string, title: string = 'تحذير!', duration: number = 3500): void {
    this.show({
      id: this.generateId(),
      type: 'warning',
      message,
      title,
      duration
    });
  }

  /**
   * Show info toast
   * @param message - Main message to display
   * @param title - Optional title (default: 'معلومة')
   * @param duration - Optional duration in ms (default: 3000)
   */
  info(message: string, title: string = 'معلومة', duration: number = 3000): void {
    this.show({
      id: this.generateId(),
      type: 'info',
      message,
      title,
      duration
    });
  }

  /**
   * Show custom toast with full control
   * @param toast - Complete toast configuration
   */
  show(toast: Toast): void {
    this.toastSubject.next(toast);
  }

  /**
   * Generate unique ID for toast
   * @returns Unique string ID
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all toasts (if needed for future implementation)
   */
  clear(): void {
    // This could be implemented by adding a clear subject
    // For now, toasts auto-dismiss based on duration
  }
}
