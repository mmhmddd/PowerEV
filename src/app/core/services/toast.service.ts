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
   * Show custom toast
   */
  show(toast: Toast): void {
    this.toastSubject.next(toast);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
