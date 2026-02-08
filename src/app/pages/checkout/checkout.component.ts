// src/app/features/checkout/checkout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { Cart, CartItem } from '../../core/models/product.models';

type PaymentMethodType = 'cash' | 'instapay' | 'vodafonecash';

interface ShippingForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  governorate: string;
  notes: string;
  paymentMethod: PaymentMethodType;
}

interface PaymentMethod {
  value: PaymentMethodType;
  label: string;
  icon: string;
  description: string;
}

interface ConfirmationModal {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
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
    notes: '',
    paymentMethod: 'cash'
  };

  confirmationModal: ConfirmationModal = {
    show: false,
    title: '',
    message: '',
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    onConfirm: () => {}
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

  paymentMethods: PaymentMethod[] = [
    {
      value: 'cash',
      label: 'الدفع عند الاستلام',
      icon: 'bi-cash-coin',
      description: 'ادفع نقداً عند استلام طلبك'
    },
    {
      value: 'instapay',
      label: 'إنستاباي',
      icon: 'bi-phone',
      description: 'الدفع عبر إنستاباي'
    },
    {
      value: 'vodafonecash',
      label: 'فودافون كاش',
      icon: 'bi-wallet2',
      description: 'الدفع عبر فودافون كاش'
    }
  ];

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private toastService: ToastService,
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
            this.toastService.warning('الرجاء إضافة منتجات أولاً', 'السلة فارغة');
            this.router.navigate(['/cart']);
          }
        },
        error: (error) => {
          console.error('Error loading cart:', error);
          this.toastService.error('حدث خطأ أثناء تحميل السلة');
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
   * Select payment method
   */
  selectPaymentMethod(method: PaymentMethodType): void {
    this.shippingData.paymentMethod = method;
  }

  /**
   * Get payment method label
   */
  getPaymentMethodLabel(): string {
    const method = this.paymentMethods.find(m => m.value === this.shippingData.paymentMethod);
    return method ? method.label : 'اختر طريقة الدفع';
  }

  /**
   * Show confirmation modal
   */
  private showConfirmation(title: string, message: string, onConfirm: () => void): void {
    this.confirmationModal = {
      show: true,
      title,
      message,
      confirmText: 'تأكيد',
      cancelText: 'إلغاء',
      onConfirm
    };
  }

  /**
   * Close confirmation modal
   */
  closeConfirmation(): void {
    this.confirmationModal.show = false;
  }

  /**
   * Confirm action in modal
   */
  confirmAction(): void {
    this.confirmationModal.onConfirm();
    this.closeConfirmation();
  }

  /**
   * Submit order
   */
  onSubmit(): void {
    // Validate form
    const validationError = this.validateForm();
    if (validationError) {
      this.toastService.error(validationError, 'خطأ في البيانات');
      return;
    }

    // Confirm order
    const paymentMethodLabel = this.getPaymentMethodLabel();
    const confirmMessage = `طريقة الدفع: ${paymentMethodLabel}\nالإجمالي: ${this.totalAmount} ج.م`;

    this.showConfirmation(
      'تأكيد الطلب',
      confirmMessage,
      () => this.submitOrder()
    );
  }

  /**
   * Submit order after confirmation
   */
  private submitOrder(): void {
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
      this.cartService.getSessionId(),
      this.shippingData.paymentMethod
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (response.success && response.data) {
          console.log('Order created successfully:', response.data);

          // Build success message based on payment method
          let successMessage = `رقم الطلب: ${response.data.orderNumber}`;

          if (this.shippingData.paymentMethod === 'cash') {
            successMessage += ' - سيتم التواصل معك قريباً';
          } else {
            successMessage += ' - سيتم التواصل معك لإكمال عملية الدفع';
          }

          this.toastService.success(successMessage, 'تم إنشاء الطلب بنجاح!', 5000);

          // Navigate to home
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1500);

          // Clear form
          this.resetForm();
        } else {
          this.toastService.error('حدث خطأ أثناء إنشاء الطلب. الرجاء المحاولة مرة أخرى', 'فشل إنشاء الطلب');
        }
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.isSubmitting = false;

        // Show error message
        const errorMessage = error.error?.message || 'حدث خطأ أثناء إنشاء الطلب. الرجاء المحاولة مرة أخرى';
        this.toastService.error(errorMessage);
      }
    });
  }

  /**
   * Validate form data
   */
  private validateForm(): string | null {
    if (!this.shippingData.name.trim()) {
      return 'الرجاء إدخال الاسم';
    }

    if (!this.shippingData.phone.trim()) {
      return 'الرجاء إدخال رقم الهاتف';
    }

    // Validate Egyptian phone number format
    const phoneRegex = /^(01)[0-9]{9}$/;
    if (!phoneRegex.test(this.shippingData.phone.replace(/[\s\-]/g, ''))) {
      return 'الرجاء إدخال رقم هاتف صحيح (يبدأ بـ 01 ويتكون من 11 رقم)';
    }

    if (!this.shippingData.address.trim()) {
      return 'الرجاء إدخال العنوان';
    }

    if (!this.shippingData.governorate) {
      return 'الرجاء اختيار المحافظة';
    }

    if (!this.shippingData.paymentMethod) {
      return 'الرجاء اختيار طريقة الدفع';
    }

    // Validate email if provided
    if (this.shippingData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.shippingData.email)) {
        return 'الرجاء إدخال بريد إلكتروني صحيح';
      }
    }

    return null;
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
      notes: '',
      paymentMethod: 'cash'
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
