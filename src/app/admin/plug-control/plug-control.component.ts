// src/app/admin/plug-control/plug-control.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlugService } from '../../core/services/plug.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

// Note: Using the Plug type from product.models which has ImageObject[]
// We'll need to handle the conversion between ImageObject[] and string[]
interface PlugWithSelection {
  _id: string;
  name: string;
  price: number;
  description?: string;
  images?: any[]; // Can be ImageObject[] from backend or string[] for preview
  brand?: string;
  type?: string;
  stock: number;
  offer?: number;
  createdAt?: string | Date; // Backend sends string, can be Date
  updatedAt?: string | Date; // Backend sends string, can be Date
  selected?: boolean;
}

interface PlugBackendData {
  name: string;
  price: number;
  description?: string;
  images?: string[];
  brand?: string;
  type?: string;
  stock: number;
  offer?: number;
}

@Component({
  selector: 'app-plug-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './plug-control.component.html',
  styleUrl: './plug-control.component.scss'
})
export class PlugControlComponent implements OnInit {
  // State
  plugs: PlugWithSelection[] = [];
  filteredPlugs: PlugWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedBrand = '';
  selectedType = '';
  selectedStock = '';

  // Modals
  showPlugModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms
  plugForm: Partial<PlugWithSelection> & { _id?: string } = {
    name: '',
    price: 0,
    type: '',
    brand: '',
    stock: 0,
    description: '',
    images: [],
    offer: undefined
  };

  // Selected Plug
  selectedPlug: PlugWithSelection | null = null;
  plugsToDelete: PlugWithSelection[] = [];

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
  stockOptions = ['in stock', 'out of stock'];

  constructor(private plugService: PlugService) {}

  ngOnInit(): void {
    this.loadPlugs();
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadPlugs(): void {
    this.isLoading = true;
    this.error = null;

    this.plugService.getAllPlugs().subscribe({
      next: (response) => {
        this.plugs = response.plugs.map(plug => ({
          ...plug,
          selected: false,
          // Convert ImageObject[] to string[] for internal use
          images: plug.images?.map((img: any) =>
            typeof img === 'string' ? img : img.url
          ) || [],
          // Convert Offer object to number if needed
          offer: typeof plug.offer === 'object' && plug.offer !== null
            ? (plug.offer as any).discountPercentage
            : plug.offer as number | undefined
        }));
        this.filteredPlugs = [...this.plugs];
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading plugs:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل القوابس';
        this.isLoading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique brands
    const brandSet = new Set(
      this.plugs
        .map(p => p.brand)
        .filter((br): br is string => br !== undefined && br.trim() !== '')
    );
    this.brands = Array.from(brandSet).sort();

    // Extract unique types
    const typeSet = new Set(
      this.plugs
        .map(p => p.type)
        .filter((t): t is string => t !== undefined && t.trim() !== '')
    );
    this.types = Array.from(typeSet).sort();
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterPlugs(): void {
    this.filteredPlugs = this.plugs.filter(plug => {
      // Search filter
      const matchesSearch = !this.searchTerm ||
        plug.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (plug.description && plug.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Brand filter
      const matchesBrand = !this.selectedBrand || plug.brand === this.selectedBrand;

      // Type filter
      const matchesType = !this.selectedType || plug.type === this.selectedType;

      // Stock filter
      const matchesStock = !this.selectedStock ||
        (this.selectedStock === 'in stock' && plug.stock > 0) ||
        (this.selectedStock === 'out of stock' && plug.stock === 0);

      return matchesSearch && matchesBrand && matchesType && matchesStock;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredPlugs.filter(p => p.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredPlugs.length > 0 &&
      this.filteredPlugs.every(p => p.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredPlugs.forEach(plug => plug.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Plug
  // ═══════════════════════════════════════════════════════

  openAddPlugModal(): void {
    this.isEditMode = false;
    this.plugForm = {
      name: '',
      price: 0,
      type: '',
      brand: '',
      stock: 0,
      description: '',
      images: [],
      offer: undefined
    };
    this.selectedImages = [];
    this.imagePreview = [];
    this.showPlugModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Plug
  // ═══════════════════════════════════════════════════════

  openEditPlugModal(plug: PlugWithSelection): void {
    this.isEditMode = true;
    this.selectedPlug = plug;
    this.plugForm = {
      _id: plug._id,
      name: plug.name,
      price: plug.price,
      type: plug.type || '',
      brand: plug.brand || '',
      stock: plug.stock || 0,
      description: plug.description || '',
      images: plug.images || [],
      offer: plug.offer
    };
    this.selectedImages = [];
    // Convert images to string URLs for preview
    this.imagePreview = (plug.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.url
    );
    this.showPlugModal = true;
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
  // Save Plug (Create or Update)
  // ═══════════════════════════════════════════════════════

  async savePlug(): Promise<void> {
    if (!this.validatePlugForm()) {
      return;
    }

    this.isSaving = true;

    try {
      // Convert images to base64 if new images were selected
      let imagesToSave: string[] = [];

      if (this.selectedImages.length > 0) {
        // New images selected - convert to base64
        imagesToSave = await this.convertImagesToBase64();
      } else if (this.isEditMode && this.plugForm.images && this.plugForm.images.length > 0) {
        // No new images, keep existing images
        // Convert ImageObject[] to string[] if needed
        imagesToSave = this.plugForm.images.map((img: any) =>
          typeof img === 'string' ? img : img.url
        );
      }

      // Prepare data for backend (images as string[])
      const plugData: Partial<PlugBackendData> = {
        name: this.plugForm.name,
        price: this.plugForm.price,
        stock: this.plugForm.stock || 0,
        type: this.plugForm.type || undefined,
        brand: this.plugForm.brand || undefined,
        description: this.plugForm.description || undefined,
        images: imagesToSave.length > 0 ? imagesToSave : undefined,
        offer: this.plugForm.offer !== undefined && this.plugForm.offer > 0 ? this.plugForm.offer : undefined
      };

      if (this.isEditMode && this.plugForm._id) {
        // Update plug - cast to any to bypass type checking for the service call
        this.plugService.updatePlug(this.plugForm._id, plugData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم تحديث القابس بنجاح', 'success');
            this.loadPlugs();
            this.closePlugModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating plug:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء تحديث القابس',
              'error'
            );
            this.isSaving = false;
          }
        });
      } else {
        // Create plug - cast to any to bypass type checking for the service call
        this.plugService.createPlug(plugData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم إضافة القابس بنجاح', 'success');
            this.loadPlugs();
            this.closePlugModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating plug:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء إضافة القابس',
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('Error in savePlug:', error);
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

  validatePlugForm(): boolean {
    if (!this.plugForm.name || !this.plugForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم القابس', 'error');
      return false;
    }

    if (!this.plugForm.price || this.plugForm.price <= 0) {
      this.showToastMessage('يرجى إدخال سعر صحيح', 'error');
      return false;
    }

    if (this.plugForm.stock !== undefined && this.plugForm.stock < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.plugForm.offer !== undefined &&
        (this.plugForm.offer < 0 || this.plugForm.offer > 100)) {
      this.showToastMessage('نسبة الخصم يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    return true;
  }

  closePlugModal(): void {
    this.showPlugModal = false;
    this.selectedPlug = null;
    this.selectedImages = [];
    this.imagePreview = [];
  }

  // ═══════════════════════════════════════════════════════
  // Delete Plug
  // ═══════════════════════════════════════════════════════

  confirmDeletePlug(plug: PlugWithSelection): void {
    this.selectedPlug = plug;
    this.plugsToDelete = [plug];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.plugsToDelete = this.filteredPlugs.filter(p => p.selected);

    if (this.plugsToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد قوابس للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deletePlugs(): void {
    this.isDeleting = true;

    const deletePromises = this.plugsToDelete.map(plug =>
      this.plugService.deletePlug(plug._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.plugsToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'قابس' : 'قوابس'} بنجاح`,
          'success'
        );
        this.loadPlugs();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting plugs:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف القوابس',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedPlug = null;
    this.plugsToDelete = [];
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

  calculateDiscountedPrice(price: number, offer: number | undefined): number {
    if (!offer || offer <= 0) {
      return price;
    }
    const discount = (price * offer) / 100;
    return price - discount;
  }

  getStockStatus(stock: number): string {
    return stock > 0 ? 'متوفر' : 'غير متوفر';
  }

  getStockClass(stock: number): string {
    return stock > 0 ? 'quantity-badge' : 'quantity-badge quantity-badge--out';
  }
}
