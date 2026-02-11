import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ProductService, Product as BackendProduct } from '../../core/services/product.service';
import { CartService, AddToCartRequest } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

// Image slider state interface
interface ImageSliderState {
  currentIndex: number;
  interval?: any;
}

// Touch state interface for mobile swipe
interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  moved: boolean;
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
  products: BackendProduct[] = [];

  // Adding to cart state
  addingToCartProductId: string | null = null;

  // Image slider states
  private imageSliderStates: Map<string, ImageSliderState> = new Map();
  private touchStates: Map<string, TouchState> = new Map();

  // Scroll container reference
  private scrollContainer: HTMLElement | null = null;
  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private productService: ProductService,
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
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
    // Clear all image slider intervals
    this.imageSliderStates.forEach((state) => {
      if (state.interval) {
        clearInterval(state.interval);
      }
    });
    this.imageSliderStates.clear();
    this.touchStates.clear();

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
          // Filter only in-stock products and get latest 10
          this.products = backendProducts
            .filter(product => product.inStock)
            .slice(0, 10);

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Image slider methods
   */
  startImageSlider(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product || !product.images || product.images.length <= 1) {
      return;
    }

    // Initialize state if not exists
    if (!this.imageSliderStates.has(productId)) {
      this.imageSliderStates.set(productId, { currentIndex: 0 });
    }

    const state = this.imageSliderStates.get(productId)!;

    // Clear any existing interval
    if (state.interval) {
      clearInterval(state.interval);
    }

    // Start automatic sliding
    state.interval = setInterval(() => {
      state.currentIndex = (state.currentIndex + 1) % product.images.length;
      this.imageSliderStates.set(productId, state);
    }, 1500); // Change image every 1.5 seconds
  }

  stopImageSlider(productId: string): void {
    const state = this.imageSliderStates.get(productId);
    if (state?.interval) {
      clearInterval(state.interval);
      state.interval = undefined;
      // Reset to first image
      state.currentIndex = 0;
      this.imageSliderStates.set(productId, state);
    }
  }

  getCurrentImage(product: BackendProduct): any {
    const state = this.imageSliderStates.get(product.id);
    const index = state?.currentIndex || 0;
    return product.images && product.images[index]
      ? product.images[index]
      : (product.images && product.images[0]) || { url: 'assets/images/placeholder.jpg', alt: product.name };
  }

  getCurrentImageIndex(productId: string): number {
    const state = this.imageSliderStates.get(productId);
    return state?.currentIndex || 0;
  }

  /**
   * Touch gesture methods for mobile swipe
   */
  onTouchStart(event: TouchEvent, productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product || !product.images || product.images.length <= 1) {
      return;
    }

    const touch = event.touches[0];
    this.touchStates.set(productId, {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      moved: false
    });
  }

  onTouchMove(event: TouchEvent, productId: string): void {
    const touchState = this.touchStates.get(productId);
    if (!touchState) {
      return;
    }

    const touch = event.touches[0];
    touchState.currentX = touch.clientX;

    // Check if user is swiping horizontally (not scrolling vertically)
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);

    if (deltaX > deltaY && deltaX > 10) {
      touchState.moved = true;
      // Prevent scrolling when swiping
      event.preventDefault();
    }
  }

  onTouchEnd(productId: string): void {
    const touchState = this.touchStates.get(productId);
    if (!touchState || !touchState.moved) {
      this.touchStates.delete(productId);
      return;
    }

    const product = this.products.find(p => p.id === productId);
    if (!product || !product.images) {
      this.touchStates.delete(productId);
      return;
    }

    const deltaX = touchState.currentX - touchState.startX;
    const minSwipeDistance = 50;

    // Initialize state if not exists
    if (!this.imageSliderStates.has(productId)) {
      this.imageSliderStates.set(productId, { currentIndex: 0 });
    }

    const state = this.imageSliderStates.get(productId)!;

    // Swipe right (show previous image) - RTL direction
    if (deltaX > minSwipeDistance) {
      state.currentIndex = state.currentIndex === 0
        ? product.images.length - 1
        : state.currentIndex - 1;
    }
    // Swipe left (show next image) - RTL direction
    else if (deltaX < -minSwipeDistance) {
      state.currentIndex = (state.currentIndex + 1) % product.images.length;
    }

    this.imageSliderStates.set(productId, state);
    this.touchStates.delete(productId);
  }

  /**
   * Navigation methods
   */
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

  /**
   * Add product to cart
   */
  addToCart(event: Event, product: BackendProduct): void {
    // Stop event propagation to prevent navigation
    event.stopPropagation();
    event.preventDefault();

    // Check if product is in stock
    if (!product.inStock) {
      this.toastService.error('هذا المنتج غير متوفر حالياً', 'غير متوفر');
      return;
    }

    // Prevent multiple clicks
    if (this.addingToCartProductId === product.id) {
      return;
    }

    this.addingToCartProductId = product.id;

    // Map product category type to API product type
    const productTypeMap: { [key: string]: string } = {
      'adapter': 'Adapter',
      'box': 'Box',
      'breaker': 'Breaker',
      'cable': 'Cable',
      'charger': 'Charger',
      'other': 'Other',
      'plug': 'Plug',
      'station': 'Station',
      'wire': 'Wire'
    };

    const productType = productTypeMap[product.categoryType] || 'Other';

    const cartItem: AddToCartRequest = {
      productId: product.id,
      productType: productType as any,
      quantity: 1
    };

    console.log('Adding to cart from latest products:', cartItem);

    // Add to cart via service
    this.cartService.addToCart(cartItem).subscribe({
      next: (response) => {
        this.addingToCartProductId = null;

        if (response.success && response.data) {
          console.log('Added to cart successfully:', response.data);

          // Show success toast
          this.toastService.success(
            `تم إضافة "${product.name}" إلى سلة المشتريات`,
            'تمت الإضافة!'
          );
        } else {
          this.toastService.error('حدث خطأ أثناء إضافة المنتج إلى السلة');
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.addingToCartProductId = null;

        const errorMessage = error.error?.message || 'حدث خطأ أثناء إضافة المنتج إلى السلة';
        this.toastService.error(errorMessage, 'فشلت العملية');
      }
    });
  }

  /**
   * Check if a product is currently being added to cart
   */
  isAddingToCart(productId: string): boolean {
    return this.addingToCartProductId === productId;
  }

  /**
   * View product details
   */
  viewProductDetails(product: BackendProduct): void {
    this.router.navigate(['/product-details', product.id]);
  }

  /**
   * Track by product ID for better performance
   */
  trackByProductId(index: number, product: BackendProduct): string {
    return product.id;
  }

  /**
   * Format price with currency
   */
  formatPrice(price: number): string {
    return `${price.toLocaleString('en-US')} ج.م`;
  }

  /**
   * Refresh products
   */
  refreshProducts(): void {
    this.productService.refreshProducts();
    this.loadLatestProducts();
  }
}
