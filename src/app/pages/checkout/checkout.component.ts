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
  name:          string;
  phone:         string;
  email:         string;
  address:       string;
  governorate:   string;
  notes:         string;
  paymentMethod: PaymentMethodType;
}

interface PaymentMethod {
  value:       PaymentMethodType;
  label:       string;
  icon:        string;
  description: string;
}

interface ConfirmationModal {
  show:        boolean;
  title:       string;
  message:     string;
  confirmText: string;
  cancelText:  string;
  onConfirm:   () => void;
}

@Component({
  selector:    'app-checkout',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl:    './checkout.component.scss'
})
export class CheckoutComponent implements OnInit, OnDestroy {

  cart:         Cart | null = null;
  isLoading:    boolean = false;
  isSubmitting: boolean = false;
  private destroy$ = new Subject<void>();

  paymentScreenshotFile:    File   | null = null;
  paymentScreenshotPreview: string | null = null;
  paymentScreenshotBase64:  string | null = null;
  isCompressingImage = false;

  shippingData: ShippingForm = {
    name:          '',
    phone:         '',
    email:         '',
    address:       '',
    governorate:   'القاهرة',
    notes:         '',
    paymentMethod: 'cash'
  };

  confirmationModal: ConfirmationModal = {
    show:        false,
    title:       '',
    message:     '',
    confirmText: 'تأكيد',
    cancelText:  'إلغاء',
    onConfirm:   () => {}
  };

  governorates: string[] = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية',
    'القليوبية', 'المنوفية', 'البحيرة', 'الغربية', 'كفر الشيخ',
    'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء',
    'جنوب سيناء', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر',
    'الوادي الجديد', 'مطروح',
  ];

  paymentMethods: PaymentMethod[] = [
    { value: 'cash',         label: 'الدفع عند الاستلام', icon: 'bi bi-cash-coin', description: 'ادفع نقداً عند استلام طلبك' },
    { value: 'instapay',     label: 'إنستاباي',            icon: 'bi bi-phone',     description: 'الدفع عبر إنستاباي'        },
    { value: 'vodafonecash', label: 'فودافون كاش',         icon: 'bi bi-wallet2',   description: 'الدفع عبر فودافون كاش'    },
  ];

  constructor(
    private cartService:  CartService,
    private orderService: OrderService,
    private toastService: ToastService,
    private router:       Router
  ) {}

  ngOnInit(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cart = cart;
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

    this.cartService.loadCart();
  }

  get orderItems(): CartItem[] { return this.cart?.items || []; }
  get totalAmount(): number    { return this.cart?.totalPrice || 0; }
  get itemCount(): number      { return this.cartService.getCartItemCount(); }

  get supportsScreenshot(): boolean {
    return this.shippingData.paymentMethod === 'instapay' ||
           this.shippingData.paymentMethod === 'vodafonecash';
  }

  selectPaymentMethod(method: PaymentMethodType): void {
    this.shippingData.paymentMethod = method;
    if (method === 'cash') {
      this.clearPaymentScreenshot();
    }
  }

  /** Copy text to clipboard and show a toast */
  copyText(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.success('تم النسخ بنجاح ✓');
    }).catch(() => {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.toastService.success('تم النسخ بنجاح ✓');
    });
  }

  /** Fallback when QR image fails to load */
  onQrError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    // Show a simple placeholder indicating QR is unavailable
    img.style.opacity = '0.3';
    img.style.filter = 'grayscale(1)';
    console.warn('QR code image failed to load');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Compress the image using Canvas before storing as base64.
  // ─────────────────────────────────────────────────────────────────────────
  private compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const originalDataUrl = e.target?.result as string;
        const img = new Image();

        img.onload = () => {
          const MAX = 1200;
          let { width, height } = img;

          if (width > MAX || height > MAX) {
            if (width > height) {
              height = Math.round((height * MAX) / width);
              width  = MAX;
            } else {
              width  = Math.round((width * MAX) / height);
              height = MAX;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width  = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn('Canvas not available, using original image');
            resolve(originalDataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.70);

          const origKB       = Math.round(originalDataUrl.length / 1024);
          const compressedKB = Math.round(compressed.length / 1024);
          console.log(`🗜️ Image compressed: ${origKB}KB → ${compressedKB}KB (${Math.round(compressedKB/origKB*100)}%)`);

          resolve(compressed);
        };

        img.onerror = () => {
          console.warn('Image load failed during compression, using original');
          resolve(originalDataUrl);
        };

        img.src = originalDataUrl;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async onScreenshotSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toastService.error('يرجى رفع صورة بصيغة JPG أو PNG أو WebP فقط', 'نوع ملف غير مدعوم');
      input.value = '';
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.toastService.error('حجم الصورة يجب أن يكون أقل من 10 ميجابايت', 'الصورة كبيرة جداً');
      input.value = '';
      return;
    }

    this.isCompressingImage = true;

    try {
      const compressed = await this.compressImage(file);

      this.paymentScreenshotFile    = file;
      this.paymentScreenshotPreview = compressed;
      this.paymentScreenshotBase64  = compressed;

      const sizeKB = Math.round(compressed.length / 1024);
      console.log(`✅ Screenshot ready: ${sizeKB}KB`);

      if (sizeKB > 800) {
        console.warn(`⚠️ Screenshot still large after compression: ${sizeKB}KB`);
        this.toastService.warning('الصورة كبيرة قليلاً، قد تستغرق وقتاً أطول في الرفع');
      }
    } catch (err) {
      console.error('Compression failed:', err);
      this.toastService.error('حدث خطأ أثناء معالجة الصورة');
    } finally {
      this.isCompressingImage = false;
      input.value = '';
    }
  }

  clearPaymentScreenshot(): void {
    this.paymentScreenshotFile    = null;
    this.paymentScreenshotPreview = null;
    this.paymentScreenshotBase64  = null;

    const fileInput = document.getElementById('paymentScreenshotInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  triggerFileInput(): void {
    document.getElementById('paymentScreenshotInput')?.click();
  }

  getPaymentMethodLabel(): string {
    return this.paymentMethods.find(m => m.value === this.shippingData.paymentMethod)?.label || 'اختر طريقة الدفع';
  }

  private showConfirmation(title: string, message: string, onConfirm: () => void): void {
    this.confirmationModal = {
      show: true, title, message,
      confirmText: 'تأكيد', cancelText: 'إلغاء', onConfirm,
    };
  }

  closeConfirmation(): void { this.confirmationModal.show = false; }

  confirmAction(): void {
    this.confirmationModal.onConfirm();
    this.closeConfirmation();
  }

  onSubmit(): void {
    const validationError = this.validateForm();
    if (validationError) {
      this.toastService.error(validationError, 'خطأ في البيانات');
      return;
    }

    if (this.isCompressingImage) {
      this.toastService.warning('يرجى الانتظار حتى تنتهي معالجة الصورة');
      return;
    }

    const paymentMethodLabel = this.getPaymentMethodLabel();
    const screenshotNote     = this.paymentScreenshotBase64
      ? '\n📎 تم إرفاق صورة الدفع'
      : (this.supportsScreenshot ? '\n⚠️ لم يتم إرفاق صورة الدفع' : '');

    const confirmMessage = `طريقة الدفع: ${paymentMethodLabel}\nالإجمالي: ${this.totalAmount} ج.م${screenshotNote}`;

    this.showConfirmation('تأكيد الطلب', confirmMessage, () => this.submitOrder());
  }

  private submitOrder(): void {
    this.isSubmitting = true;

    const screenshotToSend = (
      this.supportsScreenshot &&
      this.paymentScreenshotBase64 &&
      this.paymentScreenshotBase64.startsWith('data:image')
    ) ? this.paymentScreenshotBase64 : undefined;

    const sizeKB = screenshotToSend ? Math.round(screenshotToSend.length / 1024) : 0;
    console.log('🚀 Submitting order:', {
      paymentMethod:    this.shippingData.paymentMethod,
      hasScreenshot:    !!screenshotToSend,
      screenshotSizeKB: sizeKB,
    });

    if (sizeKB > 900) {
      console.warn(`⚠️ Screenshot is ${sizeKB}KB — approaching Vercel body limit.`);
    }

    this.orderService.createOrderFromCart(
      {
        name:    this.shippingData.name,
        phone:   this.shippingData.phone,
        email:   this.shippingData.email   || undefined,
        address: `${this.shippingData.address}, ${this.shippingData.governorate}`,
        notes:   this.shippingData.notes   || undefined,
      },
      this.cartService.getSessionId(),
      this.shippingData.paymentMethod,
      screenshotToSend,
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (response.success && response.data) {
          const savedScreenshot = (response.data as any).paymentScreenshot;
          console.log('✅ Order created:', response.data.orderNumber, '| screenshot:', savedScreenshot || 'null');

          if (screenshotToSend && !savedScreenshot) {
            console.error('❌ Screenshot was sent but not saved! Check Cloudinary credentials on Vercel.');
          }

          let successMessage = `رقم الطلب: ${response.data.orderNumber}`;
          successMessage += this.shippingData.paymentMethod === 'cash'
            ? ' - سيتم التواصل معك قريباً'
            : ' - سيتم التواصل معك لإكمال عملية الدفع';

          this.toastService.success(successMessage, 'تم إنشاء الطلب بنجاح!', 5000);

          setTimeout(() => { this.router.navigate(['/']); }, 1500);
          this.resetForm();
        } else {
          this.toastService.error('حدث خطأ أثناء إنشاء الطلب. الرجاء المحاولة مرة أخرى', 'فشل إنشاء الطلب');
        }
      },
      error: (error) => {
        console.error('❌ Error creating order:', error);
        this.isSubmitting = false;
        const errorMessage = error.error?.message || 'حدث خطأ أثناء إنشاء الطلب. الرجاء المحاولة مرة أخرى';
        this.toastService.error(errorMessage);
      }
    });
  }

  private validateForm(): string | null {
    if (!this.shippingData.name.trim())    return 'الرجاء إدخال الاسم';
    if (!this.shippingData.phone.trim())   return 'الرجاء إدخال رقم الهاتف';

    const phoneRegex = /^(01)[0-9]{9}$/;
    if (!phoneRegex.test(this.shippingData.phone.replace(/[\s\-]/g, ''))) {
      return 'الرجاء إدخال رقم هاتف صحيح (يبدأ بـ 01 ويتكون من 11 رقم)';
    }

    if (!this.shippingData.address.trim())    return 'الرجاء إدخال العنوان';
    if (!this.shippingData.governorate)       return 'الرجاء اختيار المحافظة';
    if (!this.shippingData.paymentMethod)     return 'الرجاء اختيار طريقة الدفع';

    if (this.shippingData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.shippingData.email)) {
        return 'الرجاء إدخال بريد إلكتروني صحيح';
      }
    }

    return null;
  }

  private resetForm(): void {
    this.shippingData = {
      name: '', phone: '', email: '', address: '',
      governorate: 'القاهرة', notes: '', paymentMethod: 'cash'
    };
    this.clearPaymentScreenshot();
  }

  goBackToCart(): void { this.router.navigate(['/cart']); }

  readonly svgPlaceholder =
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' ` +
    `width='60' height='60' viewBox='0 0 24 24' fill='none' ` +
    `stroke='%23cbd5e1' stroke-width='1.5'%3E` +
    `%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E` +
    `%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E` +
    `%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E`;

  getSafeImageUrl(url: string | undefined | null): string {
    return (url && url.trim().length > 0) ? url : this.svgPlaceholder;
  }

  onImageError(event: Event): void {
    const img            = event.target as HTMLImageElement;
    img.onerror          = null;
    img.src              = this.svgPlaceholder;
    img.style.opacity    = '0.4';
    img.style.padding    = '8px';
    img.style.background = '#f8fafc';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
