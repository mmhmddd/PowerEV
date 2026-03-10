// src/app/admin/order-control/order-control.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, CreateOrderRequest } from '../../core/services/order.service';
import { Order } from '../../core/models/product.models';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

type OrderStatus   = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed';
type PaymentMethod = 'cash' | 'instapay' | 'vodafonecash';

interface OrderWithSelection extends Order {
  selected?:          boolean;
  paymentScreenshot?: string | null;
}

interface OrderEditForm {
  _id:                  string;
  orderNumber?:         string;
  name:                 string;
  phone:                string;
  email:                string;
  address:              string;
  notes:                string;
  paymentMethod:        PaymentMethod;
  status:               OrderStatus;
  paymentStatus:        PaymentStatus;
  paymentScreenshot:    string | null;
  newScreenshotBase64:  string | null;
  removeScreenshotFlag: boolean;
}

@Component({
  selector:    'app-order-control',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './order-control.component.html',
  styleUrl:    './order-control.component.scss',
})
export class OrderControlComponent implements OnInit {

  orders:         OrderWithSelection[] = [];
  filteredOrders: OrderWithSelection[] = [];

  isLoading        = false;
  isSaving         = false;
  isDeleting       = false;
  isUpdatingStatus = false;
  error: string | null = null;

  searchTerm            = '';
  selectedStatus        = '';
  selectedPaymentStatus = '';
  selectedPaymentMethod = '';

  showOrderModal  = false;
  showViewModal   = false;
  showDeleteModal = false;
  isEditMode      = false;

  lightboxUrl: string | null = null;

  editScreenshotReplaceMode = false;
  editScreenshotPreview: string | null = null;

  orderForm:      OrderEditForm             = this.emptyOrderForm();
  selectedOrder:  OrderWithSelection | null = null;
  ordersToDelete: OrderWithSelection[]      = [];

  // Stable screenshot URL for view modal — set once when modal opens,
  // refreshed only when loadOrders() completes or updateOrder() returns data.
  selectedOrderScreenshotUrl: string | null = null;

  showToast    = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  statusOptions: { value: OrderStatus; label: string; color: string }[] = [
    { value: 'pending',    label: 'قيد الانتظار', color: 'warning' },
    { value: 'confirmed',  label: 'مؤكد',          color: 'info'    },
    { value: 'processing', label: 'قيد التجهيز',   color: 'info'    },
    { value: 'shipped',    label: 'تم الشحن',      color: 'primary' },
    { value: 'delivered',  label: 'تم التسليم',    color: 'success' },
    { value: 'cancelled',  label: 'ملغي',           color: 'danger'  },
  ];

  paymentStatusOptions: { value: PaymentStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'قيد الانتظار', color: 'warning' },
    { value: 'paid',    label: 'مدفوع',          color: 'success' },
    { value: 'failed',  label: 'فشل',             color: 'danger'  },
  ];

  paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
    { value: 'cash',         label: 'كاش'         },
    { value: 'instapay',     label: 'إنستا باي'   },
    { value: 'vodafonecash', label: 'فودافون كاش' },
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIX: extractScreenshot — single place to safely read paymentScreenshot
  // from any order-shaped object, regardless of how Angular serialized it.
  // Uses bracket notation as fallback in case TypeScript strips the property.
  // ─────────────────────────────────────────────────────────────────────────
  private extractScreenshot(o: any): string | null {
    if (!o) return null;
    // Try both property access styles
    const val = o.paymentScreenshot ?? o['paymentScreenshot'] ?? null;
    if (!val || typeof val !== 'string' || !val.trim()) return null;
    // Must be a real URL (Cloudinary uploads always start with https://)
    // or a base64 preview
    const trimmed = val.trim();
    if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;
    return null;
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error     = null;

    this.orderService.getAllOrders().subscribe({
      next: (response) => {
        const raw: any[] = Array.isArray(response.data) ? response.data : [];

        // FIX: Map every order and explicitly extract paymentScreenshot
        this.orders = raw.map(o => {
          const screenshot = this.extractScreenshot(o);
          const mapped: OrderWithSelection = {
            ...(o as any),
            selected:          false,
            paymentScreenshot: screenshot,
          };
          return mapped;
        });

        this.filteredOrders = [...this.orders];
        this.isLoading      = false;

        // Debug
        const withScreenshot = this.orders.filter(o => !!o.paymentScreenshot);
        console.log(`✅ Loaded ${this.orders.length} orders — ${withScreenshot.length} have screenshots`);
        withScreenshot.forEach(o => {
          console.log(`   📸 ${o.orderNumber}: ${o.paymentScreenshot}`);
        });

        // If view modal is open, refresh selectedOrder reference
        if (this.showViewModal && this.selectedOrder) {
          const refreshed = this.orders.find(o => o._id === this.selectedOrder!._id);
          if (refreshed) {
            this.selectedOrder              = refreshed;
            this.selectedOrderScreenshotUrl = this.extractScreenshot(refreshed);
            console.log('🔄 View modal refreshed — screenshot:', this.selectedOrderScreenshotUrl);
          }
        }
      },
      error: (err) => {
        console.error('loadOrders error:', err);
        this.error     = err.error?.message || 'حدث خطأ أثناء تحميل الطلبات';
        this.isLoading = false;
      },
    });
  }

  filterOrders(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch =
        !q ||
        (order.orderNumber || '').toLowerCase().includes(q) ||
        (order.name        || '').toLowerCase().includes(q) ||
        (order.phone       || '').includes(this.searchTerm);

      const matchesStatus        = !this.selectedStatus        || order.status        === this.selectedStatus;
      const matchesPaymentStatus = !this.selectedPaymentStatus || order.paymentStatus === this.selectedPaymentStatus;
      const matchesPaymentMethod = !this.selectedPaymentMethod || order.paymentMethod === this.selectedPaymentMethod;

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod;
    });
  }

  getOrdersByStatus(status: OrderStatus): OrderWithSelection[] {
    return this.orders.filter(o => o.status === status);
  }

  getOrdersByPaymentStatus(status: PaymentStatus): OrderWithSelection[] {
    return this.orders.filter(o => o.paymentStatus === status);
  }

  getOrdersWithScreenshot(): OrderWithSelection[] {
    return this.orders.filter(o => !!this.extractScreenshot(o));
  }

  // Public accessor used by template — delegates to extractScreenshot
  getOrderScreenshot(order: OrderWithSelection | Order | null | undefined): string | null {
    return this.extractScreenshot(order);
  }

  get selectedCount(): number {
    return this.filteredOrders.filter(o => o.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredOrders.length > 0 && this.filteredOrders.every(o => o.selected);
  }

  toggleSelectAll(): void {
    const next = !this.allSelected;
    this.filteredOrders.forEach(o => (o.selected = next));
  }

  updateSelectAll(): void {}

  // FIX: Extract screenshot ONCE when modal opens and store in stable property.
  // The template binds to `selectedOrderScreenshotUrl` (not a method call),
  // so Angular change detection cannot cause it to flicker to null mid-cycle.
  openViewModal(order: OrderWithSelection): void {
    this.selectedOrder              = order;
    this.selectedOrderScreenshotUrl = this.extractScreenshot(order);
    this.showViewModal              = true;

    console.group('👁️ openViewModal');
    console.log('Order:', order.orderNumber);
    console.log('paymentScreenshot (raw object prop):', (order as any).paymentScreenshot);
    console.log('paymentScreenshot (extractScreenshot):', this.selectedOrderScreenshotUrl);
    console.groupEnd();
  }

  closeViewModal(): void {
    this.showViewModal              = false;
    this.selectedOrder              = null;
    this.selectedOrderScreenshotUrl = null;
  }

  openScreenshotLightbox(url: string | null): void {
    if (url) this.lightboxUrl = url;
  }

  closeLightbox(): void {
    this.lightboxUrl = null;
  }

  openEditOrderModal(order: OrderWithSelection): void {
    this.isEditMode                = true;
    this.selectedOrder             = order;
    this.editScreenshotReplaceMode = false;
    this.editScreenshotPreview     = null;

    this.orderForm = {
      _id:                  order._id,
      orderNumber:          order.orderNumber,
      name:                 order.name          || '',
      phone:                order.phone         || '',
      email:                order.email         || '',
      address:              order.address       || '',
      notes:                order.notes         || '',
      paymentMethod:        (order.paymentMethod as PaymentMethod) || 'cash',
      status:               (order.status       as OrderStatus)    || 'pending',
      paymentStatus:        (order.paymentStatus as PaymentStatus) || 'pending',
      paymentScreenshot:    this.extractScreenshot(order),
      newScreenshotBase64:  null,
      removeScreenshotFlag: false,
    };

    this.showOrderModal = true;
  }

  openAddOrderModal(): void {
    this.isEditMode                = false;
    this.orderForm                 = this.emptyOrderForm();
    this.editScreenshotReplaceMode = false;
    this.editScreenshotPreview     = null;
    this.showOrderModal            = true;
  }

  closeOrderModal(): void {
    this.showOrderModal            = false;
    this.selectedOrder             = null;
    this.editScreenshotReplaceMode = false;
    this.editScreenshotPreview     = null;
  }

  startScreenshotReplace(): void {
    this.editScreenshotReplaceMode = true;
    this.editScreenshotPreview     = null;
  }

  cancelScreenshotReplace(): void {
    this.editScreenshotReplaceMode     = false;
    this.editScreenshotPreview         = null;
    this.orderForm.newScreenshotBase64 = null;
  }

  removeScreenshot(): void {
    this.orderForm.paymentScreenshot    = null;
    this.orderForm.newScreenshotBase64  = null;
    this.orderForm.removeScreenshotFlag = true;
    this.editScreenshotReplaceMode      = false;
    this.editScreenshotPreview          = null;
  }

  triggerEditFileInput(): void {
    document.getElementById('editScreenshotInput')?.click();
  }

  onEditScreenshotSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.showToastMessage('يرجى رفع صورة بصيغة JPG أو PNG أو WebP', 'error');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToastMessage('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.editScreenshotPreview          = result;
      this.orderForm.newScreenshotBase64  = result;
      this.orderForm.removeScreenshotFlag = false;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  saveOrder(): void {
    if (!this.validateOrderForm()) return;
    this.isSaving = true;

    if (this.isEditMode && this.orderForm._id) {
      this.updateExistingOrder();
    } else {
      this.createNewOrder();
    }
  }

  private updateExistingOrder(): void {
    const updateData: any = {
      name:          this.orderForm.name.trim(),
      phone:         this.orderForm.phone.replace(/[\s\-]/g, ''),
      address:       this.orderForm.address.trim(),
      paymentMethod: this.orderForm.paymentMethod,
      status:        this.orderForm.status,
      paymentStatus: this.orderForm.paymentStatus,
    };

    if (this.orderForm.email?.trim()) updateData.email = this.orderForm.email.trim();
    if (this.orderForm.notes?.trim()) updateData.notes = this.orderForm.notes.trim();

    if (this.orderForm.newScreenshotBase64) {
      updateData.paymentScreenshot = this.orderForm.newScreenshotBase64;
    } else if (this.orderForm.removeScreenshotFlag) {
      updateData.paymentScreenshot = null;
    }
    // Otherwise omit paymentScreenshot key → backend keeps existing value

    this.orderService.updateOrder(this.orderForm._id, updateData).subscribe({
      next: (response) => {
        if (response.data) {
          const freshScreenshot = this.extractScreenshot(response.data);

          // Update in local arrays
          const idx = this.orders.findIndex(o => o._id === this.orderForm._id);
          if (idx !== -1) {
            this.orders[idx].paymentScreenshot = freshScreenshot;
          }
          const fidx = this.filteredOrders.findIndex(o => o._id === this.orderForm._id);
          if (fidx !== -1) {
            this.filteredOrders[fidx].paymentScreenshot = freshScreenshot;
          }

          // Update view modal if it's showing this order
          if (this.selectedOrder?._id === this.orderForm._id) {
            this.selectedOrder.paymentScreenshot = freshScreenshot;
            this.selectedOrderScreenshotUrl       = freshScreenshot;
          }

          console.log('✅ updateOrder response — fresh screenshot:', freshScreenshot);
        }

        this.showToastMessage('تم تحديث الطلب بنجاح ✓', 'success');
        this.loadOrders();
        this.closeOrderModal();
        this.isSaving = false;
      },
      error: (err) => {
        console.error('updateOrder error:', err);
        this.showToastMessage(err.error?.message || 'حدث خطأ أثناء تحديث الطلب', 'error');
        this.isSaving = false;
      },
    });
  }

  private createNewOrder(): void {
    const createData: CreateOrderRequest = {
      name:          this.orderForm.name.trim(),
      phone:         this.orderForm.phone.replace(/[\s\-]/g, ''),
      address:       this.orderForm.address.trim(),
      notes:         this.orderForm.notes?.trim()  || undefined,
      email:         this.orderForm.email?.trim()  || undefined,
      paymentMethod: this.orderForm.paymentMethod,
      items:         [],
    };

    this.orderService.createOrder(createData).subscribe({
      next: () => {
        this.showToastMessage('تم إضافة الطلب بنجاح ✓', 'success');
        this.loadOrders();
        this.closeOrderModal();
        this.isSaving = false;
      },
      error: (err) => {
        console.error('createOrder error:', err);
        this.showToastMessage(err.error?.message || 'حدث خطأ أثناء إضافة الطلب', 'error');
        this.isSaving = false;
      },
    });
  }

  validateOrderForm(): boolean {
    if (!this.orderForm.name?.trim()) {
      this.showToastMessage('يرجى إدخال اسم العميل', 'error'); return false;
    }
    if (!this.orderForm.phone?.trim()) {
      this.showToastMessage('يرجى إدخال رقم الهاتف', 'error'); return false;
    }
    if (!/^(01)[0-9]{9}$/.test(this.orderForm.phone.replace(/[\s\-]/g, ''))) {
      this.showToastMessage('رقم الهاتف غير صحيح — يجب أن يكون (01XXXXXXXXX)', 'error'); return false;
    }
    if (!this.orderForm.address?.trim()) {
      this.showToastMessage('يرجى إدخال العنوان', 'error'); return false;
    }
    if (
      this.orderForm.email?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.orderForm.email.trim())
    ) {
      this.showToastMessage('البريد الإلكتروني غير صحيح', 'error'); return false;
    }
    return true;
  }

  updateOrderStatus(order: OrderWithSelection, status: string): void {
    if (order.status === status) return;
    this.isUpdatingStatus = true;

    this.orderService.updateOrderStatus(order._id, status).subscribe({
      next: (response) => {
        order.status = status as OrderStatus;
        if (this.selectedOrder?._id === order._id) {
          this.selectedOrder.status = status as OrderStatus;
        }
        // FIX: Also refresh screenshot from response in case it's included
        if (response.data) {
          const fresh = this.extractScreenshot(response.data);
          order.paymentScreenshot = fresh;
          if (this.selectedOrder?._id === order._id) {
            this.selectedOrder.paymentScreenshot = fresh;
            this.selectedOrderScreenshotUrl       = fresh;
          }
        }
        this.showToastMessage('تم تحديث حالة الطلب ✓', 'success');
        this.isUpdatingStatus = false;
        this.loadOrders();
      },
      error: (err) => {
        console.error('updateOrderStatus error:', err);
        this.showToastMessage(err.error?.message || 'حدث خطأ أثناء تحديث حالة الطلب', 'error');
        this.isUpdatingStatus = false;
      },
    });
  }

  updatePaymentStatus(order: OrderWithSelection, paymentStatus: string): void {
    if (order.paymentStatus === paymentStatus) return;
    this.isUpdatingStatus = true;

    this.orderService.updatePaymentStatus(order._id, paymentStatus).subscribe({
      next: (response) => {
        order.paymentStatus = paymentStatus as PaymentStatus;
        if (this.selectedOrder?._id === order._id) {
          this.selectedOrder.paymentStatus = paymentStatus as PaymentStatus;
          // FIX: refresh screenshot too
          if (response.data) {
            const fresh = this.extractScreenshot(response.data);
            this.selectedOrderScreenshotUrl = fresh;
          }
        }
        this.showToastMessage('تم تحديث حالة الدفع ✓', 'success');
        this.isUpdatingStatus = false;
        this.loadOrders();
      },
      error: (err) => {
        console.error('updatePaymentStatus error:', err);
        this.showToastMessage(err.error?.message || 'حدث خطأ أثناء تحديث حالة الدفع', 'error');
        this.isUpdatingStatus = false;
      },
    });
  }

  confirmDeleteOrder(order: OrderWithSelection): void {
    this.selectedOrder   = order;
    this.ordersToDelete  = [order];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.ordersToDelete = this.filteredOrders.filter(o => o.selected);
    if (this.ordersToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد طلبات للحذف', 'error');
      return;
    }
    this.showDeleteModal = true;
  }

  deleteOrders(): void {
    this.isDeleting = true;
    const deletes   = this.ordersToDelete.map(o => this.orderService.deleteOrder(o._id).toPromise());

    Promise.all(deletes)
      .then(() => {
        const count = this.ordersToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'طلب' : 'طلبات'} بنجاح ✓`,
          'success',
        );
        this.loadOrders();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((err) => {
        console.error('deleteOrders error:', err);
        this.showToastMessage(err?.error?.message || 'حدث خطأ أثناء حذف الطلبات', 'error');
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedOrder   = null;
    this.ordersToDelete  = [];
  }

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

  onScreenshotError(event: Event): void {
    const img   = event.target as HTMLImageElement;
    img.onerror = null;
    img.style.display = 'none';
  }

  onImageError(event: Event): void {
    const img            = event.target as HTMLImageElement;
    img.onerror          = null;
    img.src              = this.svgPlaceholder;
    img.style.opacity    = '0.4';
    img.style.padding    = '8px';
    img.style.background = '#f8fafc';
  }

  getStatusLabel(status: string): string {
    return this.statusOptions.find(s => s.value === status)?.label || status;
  }

  getStatusColor(status: string): string {
    return this.statusOptions.find(s => s.value === status)?.color || 'secondary';
  }

  getPaymentStatusLabel(status: string): string {
    return this.paymentStatusOptions.find(s => s.value === status)?.label || status;
  }

  getPaymentStatusColor(status: string): string {
    return this.paymentStatusOptions.find(s => s.value === status)?.color || 'secondary';
  }

  getPaymentMethodLabel(method: string): string {
    return this.paymentMethodOptions.find(m => m.value === method)?.label || method;
  }

  getTotalAmount(order: Order): number {
    return order.totalAmount || 0;
  }

  getItemsCount(order: Order): number {
    return order.items?.length || 0;
  }

  formatDate(dateStr: string | Date | undefined): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', {
        year:   'numeric',
        month:  'short',
        day:    'numeric',
        hour:   '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType    = type;
    this.showToast    = true;
    this.toastTimer   = setTimeout(() => (this.showToast = false), 3500);
  }

  private emptyOrderForm(): OrderEditForm {
    return {
      _id:                  '',
      orderNumber:          '',
      name:                 '',
      phone:                '',
      email:                '',
      address:              '',
      notes:                '',
      paymentMethod:        'cash',
      status:               'pending',
      paymentStatus:        'pending',
      paymentScreenshot:    null,
      newScreenshotBase64:  null,
      removeScreenshotFlag: false,
    };
  }
}
