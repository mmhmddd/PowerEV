// src/app/features/cart/cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { Cart, CartItem } from '../../core/models/product.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  isLoading: boolean = true;
  deletingItemId: string | null = null; // Track which item is being deleted
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to cart observable
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cart = cart;
          this.isLoading = false;
          console.log('Cart loaded:', cart);
        },
        error: (error) => {
          console.error('Error loading cart:', error);
          this.isLoading = false;
          this.toastService.error('حدث خطأ أثناء تحميل السلة', 'فشل التحميل');
        }
      });

    // Load cart from backend
    this.cartService.loadCart();
  }

  get cartItems(): CartItem[] {
    return this.cart?.items || [];
  }

  get subtotal(): number {
    return this.cart?.totalPrice || 0;
  }

  get total(): number {
    // Add shipping calculation here if needed
    return this.subtotal;
  }

  get itemCount(): number {
    return this.cartService.getCartItemCount();
  }

  /**
   * Increase item quantity
   */
  increaseQuantity(item: CartItem): void {
    const newQuantity = item.quantity + 1;

    // Note: Stock validation should be done by backend
    // Frontend can add additional check if needed
    this.updateItemQuantity(item, newQuantity);
  }

  /**
   * Decrease item quantity
   */
  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.updateItemQuantity(item, item.quantity - 1);
    } else {
      this.toastService.warning('الحد الأدنى للكمية هو 1', 'تنبيه');
    }
  }

  /**
   * Update item quantity in cart
   */
  private updateItemQuantity(item: CartItem, newQuantity: number): void {
    this.isLoading = true;

    this.cartService.updateCartItem(
      item.productId,
      item.productType,
      newQuantity
    ).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Item quantity updated successfully');
          this.toastService.success(
            `تم تحديث كمية "${item.name}" إلى ${newQuantity}`,
            'تم التحديث'
          );
        } else {
          this.toastService.error('فشل تحديث الكمية', 'خطأ');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating item quantity:', error);
        const errorMessage = error.error?.message || 'حدث خطأ أثناء تحديث الكمية';
        this.toastService.error(errorMessage, 'فشل التحديث');
        this.isLoading = false;
      }
    });
  }

  /**
   * Remove item from cart
   */
  removeItem(item: CartItem): void {
    // Set deleting state for this specific item
    this.deletingItemId = item.productId;

    this.cartService.removeFromCart(item.productId, item.productType)
      .subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Item removed successfully');
            this.toastService.success(
              `تم حذف "${item.name}" من السلة`,
              'تم الحذف بنجاح'
            );
          } else {
            this.toastService.error('فشل حذف المنتج', 'خطأ');
          }
          this.deletingItemId = null;
        },
        error: (error) => {
          console.error('Error removing item:', error);
          const errorMessage = error.error?.message || 'حدث خطأ أثناء حذف المنتج';
          this.toastService.error(errorMessage, 'فشل الحذف');
          this.deletingItemId = null;
        }
      });
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    // Show warning before clearing
    if (this.cartItems.length === 0) {
      this.toastService.info('السلة فارغة بالفعل', 'تنبيه');
      return;
    }

    this.isLoading = true;

    this.cartService.clearCart().subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Cart cleared successfully');
          this.toastService.success(
            'تم حذف جميع المنتجات من السلة',
            'تم الحذف'
          );
        } else {
          this.toastService.error('فشل تفريغ السلة', 'خطأ');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
        const errorMessage = error.error?.message || 'حدث خطأ أثناء حذف السلة';
        this.toastService.error(errorMessage, 'فشل العملية');
        this.isLoading = false;
      }
    });
  }

  /**
   * Navigate to checkout
   */
  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      this.toastService.warning('السلة فارغة. الرجاء إضافة منتجات أولاً.', 'لا يمكن المتابعة');
      return;
    }

    this.toastService.info('جاري تحويلك إلى صفحة الدفع...', 'يرجى الانتظار');

    // Small delay for better UX
    setTimeout(() => {
      this.router.navigate(['/checkout']);
    }, 500);
  }

  /**
   * Check if a specific item is being deleted
   */
  isDeleting(productId: string): boolean {
    return this.deletingItemId === productId;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
