import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, CreateOrderRequest } from '../../core/services/order.service';
import { Order } from '../../core/models/product.models';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface OrderWithSelection extends Order {
  selected?: boolean;
}

@Component({
  selector: 'app-order-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './order-control.component.html',
  styleUrl: './order-control.component.scss'
})
export class OrderControlComponent implements OnInit {
  // State
  orders: OrderWithSelection[] = [];
  filteredOrders: OrderWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedStatus = '';
  selectedPaymentStatus = '';
  selectedPaymentMethod = '';

  // Modals
  showOrderModal = false;
  showViewModal = false;
  showDeleteModal = false;
  isEditMode = false;

  // Forms
  orderForm: any = {
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    paymentMethod: 'cash',
    status: 'pending',
    paymentStatus: 'pending'
  };

  // Selected Order
  selectedOrder: OrderWithSelection | null = null;
  ordersToDelete: OrderWithSelection[] = [];

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Status options
  statusOptions = [
    { value: 'pending', label: 'قيد الانتظار', color: 'warning' },
    { value: 'confirmed', label: 'مؤكد', color: 'info' },
    { value: 'processing', label: 'قيد التجهيز', color: 'info' },
    { value: 'shipped', label: 'تم الشحن', color: 'primary' },
    { value: 'delivered', label: 'تم التسليم', color: 'success' },
    { value: 'cancelled', label: 'ملغي', color: 'danger' }
  ];

  paymentStatusOptions = [
    { value: 'pending', label: 'قيد الانتظار', color: 'warning' },
    { value: 'paid', label: 'مدفوع', color: 'success' },
    { value: 'failed', label: 'فشل', color: 'danger' }
  ];

  paymentMethodOptions = [
    { value: 'cash', label: 'كاش' },
    { value: 'instapay', label: 'إنستا باي' },
    { value: 'vodafonecash', label: 'فودافون كاش' }
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;

    this.orderService.getAllOrders().subscribe({
      next: (response) => {
        // Handle response - data is always an array
        const ordersArray: Order[] = response.data || [];

        this.orders = ordersArray.map(order => ({
          ...order,
          selected: false
        }));
        this.filteredOrders = [...this.orders];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل الطلبات';
        this.isLoading = false;
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterOrders(): void {
    this.filteredOrders = this.orders.filter(order => {
      // Search filter
      const orderNumber = order.orderNumber || '';
      const customerName = order.name || '';
      const customerPhone = order.phone || '';
      const matchesSearch = !this.searchTerm ||
        orderNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customerPhone.includes(this.searchTerm);

      // Status filter
      const matchesStatus = !this.selectedStatus || order.status === this.selectedStatus;

      // Payment status filter
      const matchesPaymentStatus = !this.selectedPaymentStatus ||
        order.paymentStatus === this.selectedPaymentStatus;

      // Payment method filter
      const matchesPaymentMethod = !this.selectedPaymentMethod ||
        order.paymentMethod === this.selectedPaymentMethod;

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Filter by status helper
  // ═══════════════════════════════════════════════════════

  getOrdersByStatus(status: string): OrderWithSelection[] {
    return this.orders.filter(order => order.status === status);
  }

  getOrdersByPaymentStatus(paymentStatus: string): OrderWithSelection[] {
    return this.orders.filter(order => order.paymentStatus === paymentStatus);
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredOrders.filter(o => o.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredOrders.length > 0 &&
      this.filteredOrders.every(o => o.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredOrders.forEach(order => order.selected = newState);
  }

  updateSelectAll(): void {
    // This is called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Order
  // ═══════════════════════════════════════════════════════

  openAddOrderModal(): void {
    this.isEditMode = false;
    this.orderForm = {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      paymentMethod: 'cash',
      status: 'pending',
      paymentStatus: 'pending',
      items: []
    };
    this.showOrderModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // View Order
  // ═══════════════════════════════════════════════════════

  openViewModal(order: OrderWithSelection): void {
    this.selectedOrder = order;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedOrder = null;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Order
  // ═══════════════════════════════════════════════════════

  openEditOrderModal(order: OrderWithSelection): void {
    this.isEditMode = true;
    this.selectedOrder = order;
    this.orderForm = {
      _id: order._id,
      name: order.name,
      phone: order.phone,
      email: order.email || '',
      address: order.address,
      notes: order.notes || '',
      paymentMethod: order.paymentMethod,
      status: order.status,
      paymentStatus: order.paymentStatus
    };
    this.showOrderModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Save Order (Create or Update)
  // ═══════════════════════════════════════════════════════

  saveOrder(): void {
    if (!this.validateOrderForm()) {
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.orderForm._id) {
      // Update order
      const updateData = {
        name: this.orderForm.name,
        phone: this.orderForm.phone,
        email: this.orderForm.email,
        address: this.orderForm.address,
        notes: this.orderForm.notes,
        paymentMethod: this.orderForm.paymentMethod,
        status: this.orderForm.status,
        paymentStatus: this.orderForm.paymentStatus
      };

      this.orderService.updateOrder(this.orderForm._id, updateData).subscribe({
        next: (response) => {
          this.showToastMessage('تم تحديث الطلب بنجاح', 'success');
          this.loadOrders();
          this.closeOrderModal();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error updating order:', error);
          this.showToastMessage(
            error.error?.message || 'حدث خطأ أثناء تحديث الطلب',
            'error'
          );
          this.isSaving = false;
        }
      });
    } else {
      // Create order (Note: This is simplified - you may need to handle items differently)
      const createData: CreateOrderRequest = {
        name: this.orderForm.name,
        phone: this.orderForm.phone,
        email: this.orderForm.email,
        address: this.orderForm.address,
        notes: this.orderForm.notes,
        paymentMethod: this.orderForm.paymentMethod,
        items: [] // You would need to add item management here
      };

      this.orderService.createOrder(createData).subscribe({
        next: (response) => {
          this.showToastMessage('تم إضافة الطلب بنجاح', 'success');
          this.loadOrders();
          this.closeOrderModal();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error creating order:', error);
          this.showToastMessage(
            error.error?.message || 'حدث خطأ أثناء إضافة الطلب',
            'error'
          );
          this.isSaving = false;
        }
      });
    }
  }

  validateOrderForm(): boolean {
    if (!this.orderForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم العميل', 'error');
      return false;
    }

    if (!this.orderForm.phone.trim()) {
      this.showToastMessage('يرجى إدخال رقم الهاتف', 'error');
      return false;
    }

    const phoneRegex = /^(01)[0-9]{9}$/;
    if (!phoneRegex.test(this.orderForm.phone.replace(/[\s\-]/g, ''))) {
      this.showToastMessage('رقم هاتف غير صحيح. يجب أن يكون بصيغة (01XXXXXXXXX)', 'error');
      return false;
    }

    if (!this.orderForm.address.trim()) {
      this.showToastMessage('يرجى إدخال العنوان', 'error');
      return false;
    }

    return true;
  }

  closeOrderModal(): void {
    this.showOrderModal = false;
    this.selectedOrder = null;
  }

  // ═══════════════════════════════════════════════════════
  // Quick Status Updates
  // ═══════════════════════════════════════════════════════

  updateOrderStatus(order: OrderWithSelection, status: string): void {
    this.orderService.updateOrderStatus(order._id, status).subscribe({
      next: (response) => {
        this.showToastMessage('تم تحديث حالة الطلب بنجاح', 'success');
        this.loadOrders();
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء تحديث حالة الطلب',
          'error'
        );
      }
    });
  }

  updatePaymentStatus(order: OrderWithSelection, paymentStatus: string): void {
    this.orderService.updatePaymentStatus(order._id, paymentStatus).subscribe({
      next: (response) => {
        this.showToastMessage('تم تحديث حالة الدفع بنجاح', 'success');
        this.loadOrders();
      },
      error: (error) => {
        console.error('Error updating payment status:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء تحديث حالة الدفع',
          'error'
        );
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // Delete Order
  // ═══════════════════════════════════════════════════════

  confirmDeleteOrder(order: OrderWithSelection): void {
    this.selectedOrder = order;
    this.ordersToDelete = [order];
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

    const deletePromises = this.ordersToDelete.map(order =>
      this.orderService.deleteOrder(order._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.ordersToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'طلب' : 'طلبات'} بنجاح`,
          'success'
        );
        this.loadOrders();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting orders:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف الطلبات',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedOrder = null;
    this.ordersToDelete = [];
  }

  // ═══════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option ? option.label : status;
  }

  getStatusColor(status: string): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option ? option.color : 'secondary';
  }

  getPaymentStatusLabel(status: string): string {
    const option = this.paymentStatusOptions.find(s => s.value === status);
    return option ? option.label : status;
  }

  getPaymentStatusColor(status: string): string {
    const option = this.paymentStatusOptions.find(s => s.value === status);
    return option ? option.color : 'secondary';
  }

  getPaymentMethodLabel(method: string): string {
    const option = this.paymentMethodOptions.find(m => m.value === method);
    return option ? option.label : method;
  }

  getTotalAmount(order: Order): number {
    return order.totalAmount || 0;
  }

  getItemsCount(order: Order): number {
    return order.items?.length || 0;
  }

  // ═══════════════════════════════════════════════════════
  // Toast Notifications
  // ═══════════════════════════════════════════════════════

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
