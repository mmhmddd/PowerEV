import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

// Product interface
export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  alt: string;
  link: string;
}

@Component({
  selector: 'app-lates-products-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lates-products-slider.component.html',
  styleUrl: './lates-products-slider.component.scss'
})
export class LatestProductsSliderComponent implements OnInit, OnDestroy {
  // Signals for reactive state management
  currentIndex = signal(0);
  isTransitioning = signal(false);

  // Section title
  sectionTitle = 'أحدث المنتجات';

  // Products data
  products: Product[] = [
    {
      id: 'p1',
      title: 'شاحن منزلي ذكي 7kW',
      category: 'شواحن منزلية',
      price: 4500,
      image: './assets/images/products/home-charger-7kw.webp',
      alt: 'شاحن منزلي ذكي 7kW - PowerEV',
      link: '/products/home-charger-7kw'
    },
    {
      id: 'p2',
      title: 'كابل شحن Type 2',
      category: 'كابلات',
      price: 1200,
      image: './assets/images/products/type2-cable.webp',
      alt: 'كابل شحن Type 2 - PowerEV',
      link: '/products/type2-cable'
    },
    {
      id: 'p3',
      title: 'محول شحن محمول',
      category: 'محولات',
      price: 800,
      image: './assets/images/products/portable-adapter.webp',
      alt: 'محول شحن محمول - PowerEV',
      link: '/products/portable-adapter'
    },
    {
      id: 'p4',
      title: 'شاحن سريع 22kW',
      category: 'شواحن سريعة',
      price: 12000,
      image: './assets/images/products/fast-charger-22kw.webp',
      alt: 'شاحن سريع 22kW - PowerEV',
      link: '/products/fast-charger-22kw'
    },
    {
      id: 'p5',
      title: 'قاطع كهربائي 32A',
      category: 'اكسسوارات',
      price: 350,
      image: './assets/images/products/circuit-breaker-32a.webp',
      alt: 'قاطع كهربائي 32A - PowerEV',
      link: '/products/circuit-breaker-32a'
    },
    {
      id: 'p6',
      title: 'شاحن جداري AC',
      category: 'شواحن منزلية',
      price: 5500,
      image: './assets/images/products/wall-charger-ac.webp',
      alt: 'شاحن جداري AC - PowerEV',
      link: '/products/wall-charger-ac'
    }
  ];

  // Scroll container reference
  private scrollContainer: HTMLElement | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Only run in browser
    if (this.isBrowser) {
      // Get scroll container after view init
      setTimeout(() => {
        this.scrollContainer = document.querySelector('.products-scroll-container');
      }, 0);
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Navigate to previous products
   */
  prevSlide(): void {
    if (this.isTransitioning() || !this.scrollContainer) return;

    this.isTransitioning.set(true);

    // Calculate scroll position
    const cardWidth = this.getCardWidth();
    const gap = 24; // 1.5rem = 24px
    const scrollAmount = cardWidth + gap;

    // Smooth scroll
    this.scrollContainer.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => {
      this.isTransitioning.set(false);
    }, 300);
  }

  /**
   * Navigate to next products
   */
  nextSlide(): void {
    if (this.isTransitioning() || !this.scrollContainer) return;

    this.isTransitioning.set(true);

    // Calculate scroll position
    const cardWidth = this.getCardWidth();
    const gap = 24;
    const scrollAmount = cardWidth + gap;

    // Smooth scroll
    this.scrollContainer.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => {
      this.isTransitioning.set(false);
    }, 300);
  }

  /**
   * Add product to cart
   */
  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    console.log('Adding to cart:', product);
    // TODO: Implement cart service
    // this.cartService.addToCart(product);

    // Optional: Show toast notification
    // this.toastService.show(`تم إضافة ${product.title} إلى السلة`);
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByProductId(index: number, product: Product): string {
    return product.id;
  }

  /**
   * Get card width based on screen size
   */
  private getCardWidth(): number {
    if (!this.isBrowser) return 320;

    const width = window.innerWidth;

    if (width >= 768) {
      return 320; // md:min-w-[320px]
    } else {
      return 280; // min-w-[280px]
    }
  }

  /**
   * Format price with Egyptian Pound
   */
  formatPrice(price: number): string {
    return `${price.toLocaleString('ar-EG')} ج.م`;
  }
}
