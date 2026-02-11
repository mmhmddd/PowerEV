import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent implements OnInit, OnDestroy {
  isLoading = true;
  fillPercentage = 0;
  isComplete = false;

  private routerSubscription?: Subscription;
  private animationFrameId?: number;
  private hideTimer?: any;
  private startTime?: number;

  // Update this path to match your logo location
  logoPath = '/assets/images/logo/logo-removebg.png';

  // Performance optimization: use exact duration
  private readonly ANIMATION_DURATION = 5000; // Exactly 5 seconds
  private readonly COMPLETION_DELAY = 300; // Quick fade out

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Start the smooth fill animation
    this.startSmoothAnimation();

    // Listen to router events for navigation loading
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.resetLoader();
        this.isLoading = true;
        this.isComplete = false;
        this.startSmoothAnimation();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.completeLoading();
      }
    });
  }

  private startSmoothAnimation(): void {
    // Cancel any existing animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.fillPercentage = 0;
    this.startTime = performance.now();

    // Use requestAnimationFrame for buttery smooth 60fps animation
    const animate = (currentTime: number) => {
      if (!this.startTime) return;

      const elapsed = currentTime - this.startTime;
      const progress = Math.min(elapsed / this.ANIMATION_DURATION, 1);

      // Custom easing function for ultra-smooth charging effect
      // Combines ease-in-out with slight pause at key milestones
      const easedProgress = this.customEasingFunction(progress);

      this.fillPercentage = Math.round(easedProgress * 100);

      if (progress < 1) {
        // Continue animation
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Animation complete
        this.fillPercentage = 100;
        this.isComplete = true;

        // Auto-hide after showing 100% briefly
        this.hideTimer = setTimeout(() => {
          this.isLoading = false;
        }, this.COMPLETION_DELAY);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private customEasingFunction(t: number): number {
    // Smoother than standard ease-in-out
    // Uses a custom bezier-inspired curve for natural charging feel
    if (t < 0.5) {
      // Smooth acceleration (ease-in)
      return 2 * t * t;
    } else {
      // Smooth deceleration (ease-out)
      const invertedT = 1 - t;
      return 1 - 2 * invertedT * invertedT;
    }
  }

  private completeLoading(): void {
    // If navigation completes before animation, speed up to 100%
    if (this.fillPercentage < 100 && !this.isComplete) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      const startPercentage = this.fillPercentage;
      const remaining = 100 - startPercentage;
      const quickDuration = 400; // Fast completion
      const quickStartTime = performance.now();

      const quickAnimate = (currentTime: number) => {
        const elapsed = currentTime - quickStartTime;
        const progress = Math.min(elapsed / quickDuration, 1);

        // Quick ease-out
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        this.fillPercentage = Math.round(startPercentage + (remaining * easedProgress));

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(quickAnimate);
        } else {
          this.fillPercentage = 100;
          this.isComplete = true;
          this.hideTimer = setTimeout(() => {
            this.isLoading = false;
          }, this.COMPLETION_DELAY);
        }
      };

      this.animationFrameId = requestAnimationFrame(quickAnimate);
    } else if (this.fillPercentage >= 100) {
      // Already at 100%, just hide
      this.isComplete = true;
      this.hideTimer = setTimeout(() => {
        this.isLoading = false;
      }, this.COMPLETION_DELAY);
    }
  }

  private resetLoader(): void {
    this.fillPercentage = 0;
    this.isComplete = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }

    this.startTime = undefined;
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
  }
}
