// src/app/features/products/products.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Product, ProductService } from '../../core/services/product.service';
import { CartService, AddToCartRequest } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

interface ImageSliderState {
  currentIndex: number;
  interval?: any;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  moved: boolean;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  allProducts: Product[] = [];
  selectedCategory: string = 'all';
  mobileFiltersOpen: boolean = false;
  isLoading: boolean = false;
  addingToCartProductId: string | null = null;

  // Image slider states
  private imageSliderStates: Map<string, ImageSliderState> = new Map();
  private touchStates: Map<string, TouchState> = new Map();

  // Filter states
  searchQuery: string = '';
  minPrice: number = 0;
  maxPrice: number = 100000;
  showInStockOnly: boolean = false;
  selectedSort: string = 'name-asc';

  // Price range
  priceRange = {
    min: 0,
    max: 100000,
    currentMin: 0,
    currentMax: 100000
  };

  categories = [
    { id: 'all', name: 'الكل', icon: 'bi-grid-3x3-gap-fill' },
    { id: 'chargers', name: 'شواحن ومحطات شحن', icon: 'bi-plug' },
    { id: 'cables', name: 'كابلات وأسلاك', icon: 'bi-bezier2' },
    { id: 'adapters', name: 'محولات وقوابس', icon: 'bi-cpu' },
    { id: 'boxes', name: 'صناديق توزيع', icon: 'bi-box-seam' },
    { id: 'breakers', name: 'قواطع كهربائية', icon: 'bi-lightning-charge' },
    { id: 'accessories', name: 'اكسسوارات', icon: 'bi-tools' }
  ];

  sortOptions = [
    { value: 'name-asc', label: 'الاسم (أ-ي)' },
    { value: 'name-desc', label: 'الاسم (ي-أ)' },
    { value: 'price-asc', label: 'السعر (الأقل أولاً)' },
    { value: 'price-desc', label: 'السعر (الأعلى أولاً)' }
  ];

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to loading state
    this.productService.getLoadingState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.isLoading = isLoading;
      });

    // Subscribe to all products to calculate price range
    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.allProducts = products;
        if (products.length > 0) {
          const prices = products.map(p => p.finalPrice || p.price);
          this.priceRange.min = Math.floor(Math.min(...prices));
          this.priceRange.max = Math.ceil(Math.max(...prices));
          this.priceRange.currentMin = this.priceRange.min;
          this.priceRange.currentMax = this.priceRange.max;
          this.minPrice = this.priceRange.min;
          this.maxPrice = this.priceRange.max;
        }
        // Apply filters after products are loaded
        this.applyFilters();
      });

    // Check for category in query params (from navigation)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(queryParams => {
        const category = queryParams['category'];
        if (category && category !== this.selectedCategory) {
          this.selectedCategory = category;
          this.applyFilters();

          // Scroll to top of products when category changes
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      });

    // Also check for category in route params (for backwards compatibility)
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const category = params['category'];
        if (category && category !== this.selectedCategory) {
          this.selectedCategory = category;
          this.applyFilters();
        }
      });

    // Setup search with debounce
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.applyFilters();
      });
  }

  /**
   * Image slider methods
   */
  startImageSlider(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product || product.images.length <= 1) {
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

  getCurrentImage(product: Product): any {
    const state = this.imageSliderStates.get(product.id);
    const index = state?.currentIndex || 0;
    return product.images[index] || product.images[0];
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
    if (!product || product.images.length <= 1) {
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
    if (!product) {
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
   * Add product to cart from product grid
   */
  addToCart(event: Event, product: Product): void {
    // Stop event propagation to prevent navigation to product details
    event.stopPropagation();

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

    console.log('Adding to cart from products page:', cartItem);

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

  // Helper method to get category name
  getCategoryName(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.name || '';
  }

  // Helper method to get category icon
  getCategoryIcon(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.icon || '';
  }

  // Get count of in-stock products
  getInStockCount(): number {
    return this.allProducts.filter(p => p.inStock).length;
  }

  // Get active filters count
  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedCategory !== 'all') count++;
    if (this.searchQuery.trim()) count++;
    if (this.showInStockOnly) count++;
    if (this.minPrice !== this.priceRange.min || this.maxPrice !== this.priceRange.max) count++;
    return count;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    // Update URL query params when category changes
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: categoryId === 'all' ? null : categoryId },
      queryParamsHandling: 'merge'
    });
    this.applyFilters();
    this.mobileFiltersOpen = false;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchSubject$.next(query);
  }

  onPriceRangeChange(): void {
    this.applyFilters();
  }

  onStockFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  resetPriceRange(): void {
    this.minPrice = this.priceRange.min;
    this.maxPrice = this.priceRange.max;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allProducts];

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = this.filterByCategory(filtered, this.selectedCategory);
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const searchTerm = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply price range filter
    if (this.minPrice !== this.priceRange.min || this.maxPrice !== this.priceRange.max) {
      filtered = filtered.filter(product => {
        const price = product.finalPrice || product.price;
        return price >= this.minPrice && price <= this.maxPrice;
      });
    }

    // Apply stock filter
    if (this.showInStockOnly) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Apply sorting
    filtered = this.sortProducts(filtered, this.selectedSort);

    this.products = filtered;
  }

  private filterByCategory(products: Product[], category: string): Product[] {
    // Map frontend categories to backend types
    const categoryMap: { [key: string]: string[] } = {
      'chargers': ['charger', 'station'],
      'cables': ['cable', 'wire'],
      'adapters': ['adapter', 'plug'],
      'boxes': ['box'],
      'breakers': ['breaker'],
      'accessories': ['other']
    };

    const categoryTypes = categoryMap[category] || [];
    return products.filter(product =>
      categoryTypes.includes(product.categoryType)
    );
  }

  private sortProducts(products: Product[], sortBy: string): Product[] {
    const sorted = [...products];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.finalPrice || a.price) - (b.finalPrice || b.price);
        case 'price-desc':
          return (b.finalPrice || b.price) - (a.finalPrice || a.price);
        case 'name-asc':
          return a.name.localeCompare(b.name, 'ar');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'ar');
        default:
          return 0;
      }
    });

    return sorted;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.minPrice = this.priceRange.min;
    this.maxPrice = this.priceRange.max;
    this.showInStockOnly = false;
    this.selectedSort = 'name-asc';
    this.selectedCategory = 'all';

    // Clear query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });

    this.applyFilters();
  }

  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }

  viewProductDetails(product: Product): void {
    this.router.navigate(['/product-details', product.id]);
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
}
