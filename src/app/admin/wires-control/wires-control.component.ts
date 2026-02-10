// src/app/admin/wires-control/wires-control.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WireService } from '../../core/services/wire.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

// Interface for component use - handles both backend and frontend formats
interface WireWithSelection {
  _id: string;
  name: string;
  price: number;
  stock: number;
  brand?: string;
  type?: string;
  length?: number;
  offer?: {
    enabled: boolean;
    discountPercentage: number;
  };
  description?: string;
  images?: any[]; // Can be ImageObject[] from backend or string[] for preview
  createdAt?: string | Date;
  updatedAt?: string | Date;
  selected?: boolean;
}

interface WireBackendData {
  name: string;
  price: number;
  stock: number;
  brand?: string;
  type?: string;
  length?: number;
  offer?: {
    enabled: boolean;
    discountPercentage: number;
  };
  description?: string;
  images?: string[];
}

@Component({
  selector: 'app-wires-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './wires-control.component.html',
  styleUrl: './wires-control.component.scss'
})
export class WiresControlComponent implements OnInit {
  // State
  wires: WireWithSelection[] = [];
  filteredWires: WireWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedBrand = '';
  selectedType = '';
  stockFilter = '';

  // Modals
  showWireModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms
  wireForm: Partial<WireWithSelection> & { _id?: string } = {
    name: '',
    price: 0,
    stock: 0,
    brand: '',
    type: '',
    length: undefined,
    description: '',
    images: [],
    offer: {
      enabled: false,
      discountPercentage: 0
    }
  };

  // Selected Wire
  selectedWire: WireWithSelection | null = null;
  wiresToDelete: WireWithSelection[] = [];

  // Image handling
  selectedImages: File[] = [];
  imagePreview: string[] = [];
  currentImageIndex = 0;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Lists for filters
  brands: string[] = [];
  types: string[] = [];
  stockOptions = [
    { label: 'الكل', value: '' },
    { label: 'متوفر', value: 'in-stock' },
    { label: 'مخزون منخفض', value: 'low-stock' },
    { label: 'غير متوفر', value: 'out-of-stock' }
  ];

  constructor(private wireService: WireService) {}

  ngOnInit(): void {
    this.loadWires();
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadWires(): void {
    this.isLoading = true;
    this.error = null;

    this.wireService.getAllWires().subscribe({
      next: (response) => {
        this.wires = response.wires.map(wire => ({
          ...wire,
          selected: false,
          // Convert ImageObject[] to string[] for internal use
          images: wire.images?.map((img: any) =>
            typeof img === 'string' ? img : img.url
          ) || [],
          // Ensure offer has proper structure
          offer: wire.offer || {
            enabled: false,
            discountPercentage: 0
          }
        }));
        this.filteredWires = [...this.wires];
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading wires:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل الأسلاك';
        this.isLoading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique brands
    const brandSet = new Set(
      this.wires
        .map(w => w.brand)
        .filter((br): br is string => br !== undefined && br.trim() !== '')
    );
    this.brands = Array.from(brandSet).sort();

    // Extract unique types
    const typeSet = new Set(
      this.wires
        .map(w => w.type)
        .filter((t): t is string => t !== undefined && t.trim() !== '')
    );
    this.types = Array.from(typeSet).sort();
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterWires(): void {
    this.filteredWires = this.wires.filter(wire => {
      // Search filter
      const matchesSearch = !this.searchTerm ||
        wire.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (wire.description && wire.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Brand filter
      const matchesBrand = !this.selectedBrand || wire.brand === this.selectedBrand;

      // Type filter
      const matchesType = !this.selectedType || wire.type === this.selectedType;

      // Stock filter
      let matchesStock = true;
      if (this.stockFilter === 'in-stock') {
        matchesStock = wire.stock > 10;
      } else if (this.stockFilter === 'low-stock') {
        matchesStock = wire.stock > 0 && wire.stock <= 10;
      } else if (this.stockFilter === 'out-of-stock') {
        matchesStock = wire.stock === 0;
      }

      return matchesSearch && matchesBrand && matchesType && matchesStock;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredWires.filter(w => w.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredWires.length > 0 &&
      this.filteredWires.every(w => w.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredWires.forEach(wire => wire.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Wire
  // ═══════════════════════════════════════════════════════

  openAddWireModal(): void {
    this.isEditMode = false;
    this.wireForm = {
      name: '',
      price: 0,
      stock: 0,
      brand: '',
      type: '',
      length: undefined,
      description: '',
      images: [],
      offer: {
        enabled: false,
        discountPercentage: 0
      }
    };
    this.selectedImages = [];
    this.imagePreview = [];
    this.showWireModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Wire
  // ═══════════════════════════════════════════════════════

  openEditWireModal(wire: WireWithSelection): void {
    this.isEditMode = true;
    this.selectedWire = wire;
    this.wireForm = {
      _id: wire._id,
      name: wire.name,
      price: wire.price,
      stock: wire.stock,
      brand: wire.brand || '',
      type: wire.type || '',
      length: wire.length,
      description: wire.description || '',
      images: wire.images || [],
      offer: wire.offer || {
        enabled: false,
        discountPercentage: 0
      }
    };
    this.selectedImages = [];
    // Convert images to string URLs for preview
    this.imagePreview = (wire.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.url
    );
    this.showWireModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Image Handling
  // ═══════════════════════════════════════════════════════

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.selectedImages.push(...files);

      // Create preview URLs
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            this.imagePreview.push(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    this.imagePreview.splice(index, 1);
    this.selectedImages.splice(index, 1);
  }

  openImageViewer(index: number): void {
    this.currentImageIndex = index;
    this.showImageModal = true;
  }

  closeImageViewer(): void {
    this.showImageModal = false;
  }

  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage(): void {
    if (this.currentImageIndex < this.imagePreview.length - 1) {
      this.currentImageIndex++;
    }
  }

  // ═══════════════════════════════════════════════════════
  // Save Wire (Create or Update)
  // ═══════════════════════════════════════════════════════

  async saveWire(): Promise<void> {
    if (!this.validateWireForm()) {
      return;
    }

    this.isSaving = true;

    try {
      // Convert images to base64 if new images were selected
      let imagesToSave: string[] = [];

      if (this.selectedImages.length > 0) {
        // New images selected - convert to base64
        imagesToSave = await this.convertImagesToBase64();
      } else if (this.isEditMode && this.wireForm.images && this.wireForm.images.length > 0) {
        // No new images, keep existing images
        // Convert ImageObject[] to string[] if needed
        imagesToSave = this.wireForm.images.map((img: any) =>
          typeof img === 'string' ? img : img.url
        );
      }

      // Prepare data for backend
      const wireData: Partial<WireBackendData> = {
        name: this.wireForm.name,
        price: this.wireForm.price,
        stock: this.wireForm.stock || 0,
        brand: this.wireForm.brand || undefined,
        type: this.wireForm.type || undefined,
        length: this.wireForm.length,
        description: this.wireForm.description || undefined,
        images: imagesToSave.length > 0 ? imagesToSave : undefined,
        offer: this.wireForm.offer
      };

      if (this.isEditMode && this.wireForm._id) {
        // Update wire
        this.wireService.updateWire(this.wireForm._id, wireData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم تحديث السلك بنجاح', 'success');
            this.loadWires();
            this.closeWireModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating wire:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء تحديث السلك',
              'error'
            );
            this.isSaving = false;
          }
        });
      } else {
        // Create wire
        this.wireService.createWire(wireData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم إضافة السلك بنجاح', 'success');
            this.loadWires();
            this.closeWireModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating wire:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء إضافة السلك',
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('Error in saveWire:', error);
      this.showToastMessage('حدث خطأ أثناء معالجة الصور', 'error');
      this.isSaving = false;
    }
  }

  async convertImagesToBase64(): Promise<string[]> {
    const promises = this.selectedImages.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    return Promise.all(promises);
  }

  validateWireForm(): boolean {
    if (!this.wireForm.name || !this.wireForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم السلك', 'error');
      return false;
    }

    if (!this.wireForm.price || this.wireForm.price <= 0) {
      this.showToastMessage('يرجى إدخال سعر صحيح', 'error');
      return false;
    }

    if (this.wireForm.stock === undefined || this.wireForm.stock < 0) {
      this.showToastMessage('يرجى إدخال كمية صحيحة', 'error');
      return false;
    }

    if (this.wireForm.length !== undefined && this.wireForm.length < 0) {
      this.showToastMessage('الطول لا يمكن أن يكون سالب', 'error');
      return false;
    }

    if (this.wireForm.offer?.discountPercentage !== undefined &&
        (this.wireForm.offer.discountPercentage < 0 || this.wireForm.offer.discountPercentage > 100)) {
      this.showToastMessage('نسبة الخصم يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    return true;
  }

  closeWireModal(): void {
    this.showWireModal = false;
    this.selectedWire = null;
    this.selectedImages = [];
    this.imagePreview = [];
  }

  // ═══════════════════════════════════════════════════════
  // Delete Wire
  // ═══════════════════════════════════════════════════════

  confirmDeleteWire(wire: WireWithSelection): void {
    this.selectedWire = wire;
    this.wiresToDelete = [wire];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.wiresToDelete = this.filteredWires.filter(w => w.selected);

    if (this.wiresToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد أسلاك للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteWires(): void {
    this.isDeleting = true;

    const deletePromises = this.wiresToDelete.map(wire =>
      this.wireService.deleteWire(wire._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.wiresToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'سلك' : 'أسلاك'} بنجاح`,
          'success'
        );
        this.loadWires();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting wires:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف الأسلاك',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedWire = null;
    this.wiresToDelete = [];
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

  // ═══════════════════════════════════════════════════════
  // Utility Methods
  // ═══════════════════════════════════════════════════════

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(price);
  }

  calculateDiscountedPrice(price: number, offer: { enabled: boolean; discountPercentage: number } | undefined): number {
    if (!offer || !offer.enabled || !offer.discountPercentage) {
      return price;
    }
    const discount = (price * offer.discountPercentage) / 100;
    return price - discount;
  }

  getStockStatus(stock: number): string {
    if (stock === 0) return 'غير متوفر';
    if (stock <= 10) return 'مخزون منخفض';
    return 'متوفر';
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-badge stock-badge--out';
    if (stock <= 10) return 'stock-badge stock-badge--low';
    return 'stock-badge stock-badge--in';
  }
}
