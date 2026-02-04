import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Slide {
  id: number;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  buttonAriaLabel: string;
}

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss'
})
export class SliderComponent implements OnInit, OnDestroy {
  private isBrowser: boolean;
  currentSlide = 0;
  private autoPlayInterval: any;
  private autoPlayDelay = 5000;
  isAutoPlaying = true;
  isTransitioning = false;

  private touchStartX = 0;
  private touchEndX = 0;

  // Slides data
  slides: Slide[] = [
    {
      id: 1,
      title: 'خصم 20% على الشواحن المنزلية',
      description: 'احصل على شاحن منزلي عالي الجودة مع تركيب مجاني لفترة محدودة',
      image: '/assets/images/home/banner.webp',
      buttonText: 'تسوق الآن',
      buttonLink: '/products/home-chargers',
      buttonAriaLabel: 'تسوق الشواحن المنزلية بخصم 20%'
    },
    {
      id: 2,
      title: 'خدمة تركيب احترافية',
      description: 'فريق فني متخصص لتركيب وصيانة محطات الشحن',
      image: '/assets/images/home/banner2.jpeg',
      buttonText: 'احجز موعدك',
      buttonLink: '/contact',
      buttonAriaLabel: 'احجز موعد تركيب شاحن احترافي'
    },
    {
      id: 3,
      title: 'كابلات شحن عالية الجودة',
      description: 'متوافقة مع جميع أنواع السيارات الكهربائية بضمان شامل',
      image: '/assets/images/home/banner.webp',
      buttonText: 'اكتشف المزيد',
      buttonLink: '/products/cables',
      buttonAriaLabel: 'اكتشف كابلات الشحن عالية الجودة'
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  /**
   * Navigate to next slide
   */
  nextSlide(): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.resetAutoPlay();

    setTimeout(() => {
      this.isTransitioning = false;
    }, 700);
  }

  /**
   * Navigate to previous slide
   */
  prevSlide(): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.currentSlide = this.currentSlide === 0
      ? this.slides.length - 1
      : this.currentSlide - 1;
    this.resetAutoPlay();

    setTimeout(() => {
      this.isTransitioning = false;
    }, 700);
  }

  /**
   * Go to specific slide
   */
  goToSlide(index: number): void {
    if (this.isTransitioning || index === this.currentSlide) return;

    this.isTransitioning = true;
    this.currentSlide = index;
    this.resetAutoPlay();

    setTimeout(() => {
      this.isTransitioning = false;
    }, 700);
  }

  /**
   * Get previous slide index
   */
  getPrevSlideIndex(): number {
    return this.currentSlide === 0
      ? this.slides.length - 1
      : this.currentSlide - 1;
  }

  /**
   * Get next slide index
   */
  getNextSlideIndex(): number {
    return (this.currentSlide + 1) % this.slides.length;
  }

  /**
   * Start auto-play
   */
  private startAutoPlay(): void {
    if (!this.isAutoPlaying) return;

    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoPlayDelay);
  }

  /**
   * Stop auto-play
   */
  private stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  /**
   * Reset auto-play timer
   */
  private resetAutoPlay(): void {
    this.stopAutoPlay();
    if (this.isBrowser && this.isAutoPlaying) {
      this.startAutoPlay();
    }
  }

  /**
   * Pause auto-play on mouse enter
   */
  onMouseEnter(): void {
    this.stopAutoPlay();
  }

  /**
   * Resume auto-play on mouse leave
   */
  onMouseLeave(): void {
    if (this.isBrowser && this.isAutoPlaying) {
      this.startAutoPlay();
    }
  }

  /**
   * Handle touch start
   */
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  /**
   * Handle touch end
   */
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  /**
   * Handle swipe gesture
   */
  private handleSwipe(): void {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isBrowser) return;

    const sliderElement = document.querySelector('.slider-section');
    if (!sliderElement) return;

    const rect = sliderElement.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom >= 0;

    if (isInViewport) {
      if (event.key === 'ArrowLeft') {
        this.prevSlide();
      } else if (event.key === 'ArrowRight') {
        this.nextSlide();
      }
    }
  }

  /**
   * Track by function for slides
   */
  trackBySlideId(index: number, slide: Slide): number {
    return slide.id;
  }

  /**
   * Get current slide
   */
  getCurrentSlide(): Slide {
    return this.slides[this.currentSlide];
  }
}
