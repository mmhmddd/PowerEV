// src/app/shared/components/toast/toast.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { ToastService, Toast } from '../../core/services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({
          transform: 'translateX(120%) scale(0.8)',
          opacity: 0
        }),
        animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({
            transform: 'translateX(0) scale(1)',
            opacity: 1
          })
        )
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 1, 1)',
          style({
            transform: 'translateX(120%) scale(0.8)',
            opacity: 0,
            height: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0
          })
        )
      ])
    ]),
    trigger('progressBar', [
      state('start', style({ width: '100%' })),
      state('end', style({ width: '0%' })),
      transition('start => end', [
        animate('{{duration}}ms linear')
      ], { params: { duration: 3000 } })
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: (Toast & { progressState?: string })[] = [];
  private destroy$ = new Subject<void>();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toast$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toast => {
        this.addToast(toast);
      });
  }

  private addToast(toast: Toast): void {
    const toastWithProgress = { ...toast, progressState: 'start' };
    this.toasts.push(toastWithProgress);

    // Start progress animation
    setTimeout(() => {
      const index = this.toasts.findIndex(t => t.id === toast.id);
      if (index !== -1) {
        this.toasts[index].progressState = 'end';
      }
    }, 10);

    // Auto remove after duration
    if (toast.duration) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration);
    }
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };
    return icons[type] || 'bi-info-circle-fill';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
