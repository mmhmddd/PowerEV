import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ProductService, Product as BackendProduct } from '../../core/services/product.service';

// Frontend Product interface for slider
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
  isLoading = signal(true);

  // Section title
  sectionTitle = 'أحدث المنتجات';

  // Products data
  products: Product[] = [];

  // Scroll container reference
  private scrollContainer: HTMLElement | null = null;
  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private productService: ProductService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Load products from backend
    this.loadLatestProducts();

    // Only run in browser
    if (this.isBrowser) {
      // Get scroll container after view init
      setTimeout(() => {
        this.scrollContainer = document.querySelector('.products-scroll-container');
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load latest products from backend
   */
  private loadLatestProducts(): void {
    this.isLoading.set(true);

    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (backendProducts) => {
          // Transform backend products to frontend format
          this.products = this.transformProducts(backendProducts);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.isLoading.set(false);
          // Optionally show error message to user
        }
      });
  }

  /**
   * Transform backend products to frontend Product interface
   * Gets the latest 10 products sorted by ID (newest first)
   */
  private transformProducts(backendProducts: BackendProduct[]): Product[] {
    // Filter only in-stock products and get latest 10
    const latestProducts = backendProducts
      .filter(product => product.inStock)
      .slice(0, 10); // Get first 10 products (latest)

    return latestProducts.map(product => ({
      id: product.id,
      title: product.name,
      category: product.category,
      price: product.finalPrice || product.price,
      image: product.images && product.images.length > 0
        ? product.images[0].url
        : 'assets/images/placeholder.jpg',
      alt: product.images && product.images.length > 0
        ? product.images[0].alt
        : product.name,
      link: `/products/${this.getCategorySlug(product.categoryType)}/${product.id}`
    }));
  }

  /**
   * Get category slug for routing
   */
  private getCategorySlug(categoryType: string): string {
    const categoryMap: { [key: string]: string } = {
      'adapter': 'adapters',
      'box': 'boxes',
      'breaker': 'breakers',
      'cable': 'cables',
      'charger': 'chargers',
      'other': 'others',
      'plug': 'plugs',
      'station': 'stations',
      'wire': 'wires'
    };

    return categoryMap[categoryType] || 'products';
  }


  prevSlide(): void {
    if (this.isTransitioning() || !this.scrollContainer) return;

    this.isTransitioning.set(true);

    const containerWidth = this.scrollContainer.offsetWidth;
    const scrollAmount = containerWidth;

    this.scrollContainer.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => {
      this.isTransitioning.set(false);
    }, 300);
  }


  nextSlide(): void {
    if (this.isTransitioning() || !this.scrollContainer) return;

    this.isTransitioning.set(true);

    const containerWidth = this.scrollContainer.offsetWidth;
    const scrollAmount = containerWidth;

    // Smooth scroll
    this.scrollContainer.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => {
      this.isTransitioning.set(false);
    }, 300);
  }


  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    console.log('Adding to cart:', product);
  }


  trackByProductId(index: number, product: Product): string {
    return product.id;
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString('en-US')} LE`;
  }

  refreshProducts(): void {
    this.productService.refreshProducts();
    this.loadLatestProducts();
  }
}
