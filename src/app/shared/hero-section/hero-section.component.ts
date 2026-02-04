import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
  animations: [
    trigger('fadeInUp', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(40px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', animate('800ms ease-out'))
    ]),
    trigger('fadeIn', [
      state('void', style({
        opacity: 0
      })),
      state('*', style({
        opacity: 1
      })),
      transition('void => *', animate('1000ms ease-in'))
    ])
  ]
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  private isBrowser: boolean;
  isLoaded = false;
  

  // Hero content
  heroContent = {
    title: {
      main: 'حلول شحن',
      highlight: 'السيارات الكهربائية'
    },
    subtitle: 'أفضل منتجات شحن السيارات الكهربائية في مصر. جودة عالية، ضمان شامل، وخدمة تركيب احترافية لراحتك.',
    buttons: [
      {
        text: 'احجز معاد تركيب',
        link: '/contact',
        type: 'primary',
        ariaLabel: 'احجز موعد تركيب شاحن السيارة الكهربائية'
      },
      {
        text: 'تصفح المنتجات',
        link: '/products',
        type: 'secondary',
        ariaLabel: 'تصفح منتجات شواحن السيارات الكهربائية'
      }
    ]
  };

  // Background image - you can change this to your actual image path
  backgroundImage = '/assets/images/hero/hero-bg.jpg';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Trigger animation after component loads
    if (this.isBrowser) {
      setTimeout(() => {
        this.isLoaded = true;
      }, 100);
    } else {
      this.isLoaded = true; // For SSR
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Scroll to specific section
   */
  scrollToSection(sectionId: string): void {
    if (this.isBrowser) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  /**
   * Track by function for buttons
   */
  trackByText(index: number, item: any): string {
    return item.text;
  }
}
