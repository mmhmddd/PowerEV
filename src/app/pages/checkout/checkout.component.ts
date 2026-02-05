// src/app/features/checkout/checkout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { Cart, CartItem } from '../../core/models/product.models';

interface ShippingForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  governorate: string;
  notes: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  private destroy$ = new Subject<void>();

  shippingData: ShippingForm = {
    name: '',
    phone: '',
    email: '',
    address: '',
    governorate: 'القاهرة',
    notes: ''
  };

  governorates: string[] = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'الدقهلية',
    'الشرقية',
    'القليوبية',
    'المنوفية',
    'البحيرة',
    'الغربية',
    'كفر الشيخ',
    'دمياط',
    'بورسعيد',
    'الإسماعيلية',
    'السويس',
    'شمال سيناء',
    'جنوب سيناء',
    'الفيوم',
    'بني سويف',
    'المنيا',
    'أسيوط',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
    'البحر الأحمر',
    'الوادي الجديد',
    'مطروح'
  ];

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to cart
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cart = cart;

          // Redirect to cart if empty
          if (!cart || cart.items.length === 0) {
            alert('السلة فارغة. الرجاء إضافة منتجات أولاً.');
            this.router.navigate(['/cart']);
          }
        },
        error: (error) => {
          console.error('Error loading cart:', error);
        }
      });

    // Load cart
    this.cartService.loadCart();
  }

  get orderItems(): CartItem[] {
    return this.cart?.items || [];
  }

  get totalAmount(): number {
    return this.cart?.totalPrice || 0;
  }

  get itemCount(): number {
    return this.cartService.getCartItemCount();
  }

  /**
   * Submit order
   */
  onSubmit(): void {
    // Validate form
    if (!this.validateForm()) {
      return;
    }

    // Confirm order
    if (!confirm('هل أنت متأكد من إتمام الطلب؟')) {
      return;
    }

    this.isSubmitting = true;

    // Create order from cart
    this.orderService.createOrderFromCart(
      {
        name: this.shippingData.name,
        phone: this.shippingData.phone,
        email: this.shippingData.email || undefined,
        address: `${this.shippingData.address}, ${this.shippingData.governorate}`,
        notes: this.shippingData.notes || undefined
      },
      this.cartService.getSessionId()
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (response.success && response.data) {
          console.log('Order created successfully:', response.data);

          // Show success message
          alert(`تم إنشاء طلبك بنجاح!\nرقم الطلب: ${response.data.orderNumber}\nسيتم التواصل معك قريباً.`);

          // Navigate to order confirmation or home
          this.router.navigate(['/']);

          // Clear form
          this.resetForm();
        } else {
          alert('حدث خطأ أثناء إنشاء الطلب. الرجاء المحاولة مرة أخرى.');
        }
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.isSubmitting = false;

        // Show error message
        const errorMessage = error.error?.message || 'حدث خطأ أثناء إنشاء الطلب. الرجاء المحاولة مرة أخرى.';
        alert(errorMessage);
      }
    });
  }

  /**
   * Validate form data
   */
  private validateForm(): boolean {
    if (!this.shippingData.name.trim()) {
      alert('الرجاء إدخال الاسم');
      return false;
    }

    if (!this.shippingData.phone.trim()) {
      alert('الرجاء إدخال رقم الهاتف');
      return false;
    }

    // Validate Egyptian phone number format
    const phoneRegex = /^(01)[0-9]{9}$/;
    if (!phoneRegex.test(this.shippingData.phone.replace(/[\s\-]/g, ''))) {
      alert('الرجاء إدخال رقم هاتف صحيح (يبدأ بـ 01 ويتكون من 11 رقم)');
      return false;
    }

    if (!this.shippingData.address.trim()) {
      alert('الرجاء إدخال العنوان');
      return false;
    }

    if (!this.shippingData.governorate) {
      alert('الرجاء اختيار المحافظة');
      return false;
    }

    // Validate email if provided
    if (this.shippingData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.shippingData.email)) {
        alert('الرجاء إدخال بريد إلكتروني صحيح');
        return false;
      }
    }

    return true;
  }

  /**
   * Reset form
   */
  private resetForm(): void {
    this.shippingData = {
      name: '',
      phone: '',
      email: '',
      address: '',
      governorate: 'القاهرة',
      notes: ''
    };
  }

  /**
   * Go back to cart
   */
  goBackToCart(): void {
    this.router.navigate(['/cart']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
