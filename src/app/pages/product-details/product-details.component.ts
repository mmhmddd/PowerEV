// src/app/features/product-details/product-details.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Product, ProductService } from '../../core/services/product.service';
import { CartService, AddToCartRequest } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  selectedImageIndex: number = 0;
  quantity: number = 1;
  showAddedToCart: boolean = false;
  isLoading: boolean = true;
  isAddingToCart: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to route params to get the product ID
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const productId = params['id'];
        if (productId) {
          this.loadProduct(productId);
        } else {
          this.isLoading = false;
          this.router.navigate(['/products']);
        }
      });
  }

  /**
   * Check if Web Share API is supported
   */
  get isShareSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share;
  }

  /**
   * Load product by ID - waits for products to be loaded from service
   */
  private loadProduct(productId: string): void {
    this.isLoading = true;

    // Subscribe to all products observable to ensure products are loaded
    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        if (products.length > 0) {
          // Find the product by ID
          this.product = this.productService.getProductById(productId) ?? null;
          this.isLoading = false;

          // Redirect if product not found
          if (!this.product) {
            console.warn(`Product with ID ${productId} not found`);
            this.toastService.error('لم نتمكن من العثور على المنتج المطلوب', 'المنتج غير موجود');
            this.router.navigate(['/products']);
          } else {
            // Reset image index and quantity when product loads
            this.selectedImageIndex = 0;
            this.quantity = 1;
            console.log('Product loaded:', this.product);
          }
        }
      });
  }

  /**
   * Select a specific image by index
   */
  selectImage(index: number): void {
    if (this.product && this.product.images.length > 0) {
      this.selectedImageIndex = Math.max(0, Math.min(index, this.product.images.length - 1));
    }
  }

  /**
   * Navigate to next image
   */
  nextImage(): void {
    if (this.product && this.product.images.length > 1) {
      this.selectedImageIndex = (this.selectedImageIndex + 1) % this.product.images.length;
    }
  }

  /**
   * Navigate to previous image
   */
  prevImage(): void {
    if (this.product && this.product.images.length > 1) {
      this.selectedImageIndex = (this.selectedImageIndex - 1 + this.product.images.length) % this.product.images.length;
    }
  }

  /**
   * Increment product quantity
   */
  incrementQuantity(): void {
    if (this.product && this.product.stock) {
      // Check stock availability
      if (this.quantity < this.product.stock) {
        this.quantity++;
      } else {
        this.toastService.warning(
          `الكمية المتاحة في المخزون هي ${this.product.stock} فقط`,
          'تجاوز المخزون'
        );
      }
    } else {
      this.quantity++;
    }
  }

  /**
   * Decrement product quantity
   */
  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  /**
   * Add product to cart with backend integration
   */
  addToCart(): void {
    if (!this.product || !this.product.inStock) {
      this.toastService.error('هذا المنتج غير متوفر حالياً', 'غير متوفر');
      return;
    }

    this.isAddingToCart = true;

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

    const productType = productTypeMap[this.product.categoryType] || 'Other';

    const cartItem: AddToCartRequest = {
      productId: this.product.id,
      productType: productType as any,
      quantity: this.quantity
    };

    console.log('Adding to cart:', cartItem);

    // Add to cart via service
    this.cartService.addToCart(cartItem).subscribe({
      next: (response) => {
        this.isAddingToCart = false;

        if (response.success && response.data) {
          console.log('Added to cart successfully:', response.data);

          // Show success feedback
          this.showAddedToCart = true;

          // Show toast notification
          const quantityText = this.quantity > 1 ? ` (${this.quantity} قطع)` : '';
          this.toastService.success(
            `تم إضافة "${this.product!.name}"${quantityText} إلى سلة المشتريات`,
            'تمت الإضافة!'
          );

          // Reset feedback after 2 seconds
          setTimeout(() => {
            this.showAddedToCart = false;
          }, 2000);

          // Reset quantity
          this.quantity = 1;
        } else {
          this.toastService.error('حدث خطأ أثناء إضافة المنتج إلى السلة');
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.isAddingToCart = false;

        const errorMessage = error.error?.message || 'حدث خطأ أثناء إضافة المنتج إلى السلة';
        this.toastService.error(errorMessage, 'فشلت العملية');
      }
    });
  }

  /**
   * Navigate back to products list
   */
  goBack(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Share product page using Web Share API
   */
  sharePage(): void {
    if (this.product && typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: this.product.name,
        text: this.product.description,
        url: window.location.href
      }).then(() => {
        console.log('Product shared successfully');
        this.toastService.success('تم مشاركة المنتج بنجاح', 'تمت المشاركة!');
      }).catch(err => {
        console.error('Error sharing:', err);
        if (err.name !== 'AbortError') {
          this.toastService.error('فشلت عملية المشاركة', 'خطأ');
        }
      });
    } else {
      console.warn('Web Share API not supported');
      this.toastService.warning('المشاركة غير مدعومة في هذا المتصفح', 'غير مدعوم');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
