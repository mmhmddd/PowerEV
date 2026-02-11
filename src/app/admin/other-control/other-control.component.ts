import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OtherService } from '../../core/services/other.service';
import { Other, ImageObject } from '../../core/models/product.models';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface OtherWithSelection extends Omit<Other, 'images'> {
  selected?: boolean;
  images?: (string | ImageObject)[];
}

// Interface for backend data (images as strings)
interface OtherBackendData {
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
  selector: 'app-other-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './other-control.component.html',
  styleUrl: './other-control.component.scss'
})
export class OtherControlComponent implements OnInit {
  // State
  others: OtherWithSelection[] = [];
  filteredOthers: OtherWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedBrand = '';
  selectedType = '';

  // Modals
  showOtherModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms - Using explicit interface to avoid type conflicts
  otherForm: {
    _id?: string;
    name: string;
    brand: string;
    price: number;
    stock: number;
    type?: string;
    description: string;
    images: (string | ImageObject)[];
    offer?: number;
  } = {
    name: '',
    brand: '',
    price: 0,
    stock: 0,
    type: undefined,
    description: '',
    images: [],
    offer: undefined
  };

  // Selected Other
  selectedOther: OtherWithSelection | null = null;
  othersToDelete: OtherWithSelection[] = [];

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

  constructor(private otherService: OtherService) {}

  ngOnInit(): void {
    this.loadOthers();
  }

  // ═══════════════════════════════════════════════════════
  // Utility Methods - Calculate Discounted Price
  // ═══════════════════════════════════════════════════════

  calculateDiscountedPrice(price: number, offer: number | undefined): number {
    if (!offer || offer === 0) {
      return price;
    }

    const discount = (price * offer) / 100;
    return price - discount;
  }

  // Helper method to extract offer value from Other object
  getOfferValue(other: OtherWithSelection): number | undefined {
    const offer = other.offer as any;
    if (typeof offer === 'number') {
      return offer;
    }
    return undefined;
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadOthers(): void {
    this.isLoading = true;
    this.error = null;

    this.otherService.getAllOthers().subscribe({
      next: (response) => {
        this.others = response.others.map(other => {
          // Extract offer as number
          const offerValue = typeof (other.offer as any) === 'number'
            ? (other.offer as any)
            : undefined;

          return {
            ...other,
            offer: offerValue,
            selected: false,
            images: other.images || []
          } as OtherWithSelection;
        });
        this.filteredOthers = [...this.others];
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading others:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل المنتجات';
        this.isLoading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique brands
    const brandSet = new Set(
      this.others
        .map(o => o.brand)
        .filter((br): br is string => br !== undefined && br.trim() !== '')
    );
    this.brands = Array.from(brandSet).sort();

    // Extract unique types
    const typeSet = new Set(
      this.others
        .map(o => o.type)
        .filter((t): t is string => t !== undefined && t.trim() !== '')
    );
    this.types = Array.from(typeSet).sort();
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterOthers(): void {
    this.filteredOthers = this.others.filter(other => {
      // Search filter
      const matchesSearch = !this.searchTerm ||
        other.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (other.description && other.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Brand filter
      const matchesBrand = !this.selectedBrand || other.brand === this.selectedBrand;

      // Type filter
      const matchesType = !this.selectedType || other.type === this.selectedType;

      return matchesSearch && matchesBrand && matchesType;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredOthers.filter(o => o.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredOthers.length > 0 &&
      this.filteredOthers.every(o => o.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredOthers.forEach(other => other.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Other
  // ═══════════════════════════════════════════════════════

  openAddOtherModal(): void {
    this.isEditMode = false;
    this.otherForm = {
      name: '',
      brand: '',
      price: 0,
      stock: 0,
      type: undefined,
      description: '',
      images: [],
      offer: undefined
    };
    this.selectedImages = [];
    this.imagePreview = [];
    this.showOtherModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Other - CRITICAL: Proper image handling
  // ═══════════════════════════════════════════════════════

  openEditOtherModal(other: OtherWithSelection): void {
    this.isEditMode = true;
    this.selectedOther = other;

    // Extract offer value
    const offerValue = this.getOfferValue(other);

    this.otherForm = {
      _id: other._id,
      name: other.name,
      brand: other.brand || '',
      price: other.price,
      stock: other.stock,
      type: other.type,
      description: other.description || '',
      images: other.images || [],
      offer: offerValue
    };
    this.selectedImages = [];
    // Extract URLs from existing images for preview
    this.imagePreview = other.images?.map(img =>
      typeof img === 'string' ? img : img.url
    ) || [];
    this.showOtherModal = true;
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

    // Calculate how many existing images vs new images
    const existingImageCount = this.isEditMode && this.otherForm.images
      ? this.otherForm.images.length
      : 0;

    // If removing a new image (beyond existing count)
    if (index >= existingImageCount) {
      const newImageIndex = index - existingImageCount;
      if (newImageIndex >= 0 && newImageIndex < this.selectedImages.length) {
        this.selectedImages.splice(newImageIndex, 1);
      }
    }
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
  // Save Other (Create or Update) - FIXED: Proper image handling
  // ═══════════════════════════════════════════════════════

  async saveOther(): Promise<void> {
    if (!this.validateOtherForm()) {
      return;
    }

    this.isSaving = true;

    try {
      let imagesToSave: string[] = [];

      if (this.selectedImages.length > 0) {
        // New images selected - convert to base64
        imagesToSave = await this.convertImagesToBase64();
      } else if (this.isEditMode && this.imagePreview.length > 0) {
        // No new images in edit mode - keep existing images from preview
        imagesToSave = this.imagePreview;
      }
      // else: no images at all (imagesToSave remains empty array)

      // Prepare data for backend (images as string[])
      const otherData: Partial<OtherBackendData> = {
        name: this.otherForm.name,
        brand: this.otherForm.brand || undefined,
        price: this.otherForm.price,
        stock: this.otherForm.stock,
        type: this.otherForm.type || undefined,
        description: this.otherForm.description || undefined,
        // Always send images array (even if empty) to properly handle deletions
        images: imagesToSave,
        offer: this.otherForm.offer
      };

      if (this.isEditMode && this.otherForm._id) {
        // Update other
        this.otherService.updateOther(this.otherForm._id, otherData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم تحديث المنتج بنجاح', 'success');
            this.loadOthers();
            this.closeOtherModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating other:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء تحديث المنتج',
              'error'
            );
            this.isSaving = false;
          }
        });
      } else {
        // Create other
        this.otherService.createOther(otherData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم إضافة المنتج بنجاح', 'success');
            this.loadOthers();
            this.closeOtherModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating other:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء إضافة المنتج',
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('Error in saveOther:', error);
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

  validateOtherForm(): boolean {
    if (!this.otherForm.name || !this.otherForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم المنتج', 'error');
      return false;
    }

    if (!this.otherForm.price || this.otherForm.price <= 0) {
      this.showToastMessage('يرجى إدخال سعر صحيح', 'error');
      return false;
    }

    if (this.otherForm.stock !== undefined && this.otherForm.stock < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.otherForm.offer !== undefined &&
        (this.otherForm.offer < 0 || this.otherForm.offer > 100)) {
      this.showToastMessage('نسبة العرض يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    return true;
  }

  closeOtherModal(): void {
    this.showOtherModal = false;
    this.selectedOther = null;
    this.selectedImages = [];
    this.imagePreview = [];
  }

  // ═══════════════════════════════════════════════════════
  // Delete Other
  // ═══════════════════════════════════════════════════════

  confirmDeleteOther(other: OtherWithSelection): void {
    this.selectedOther = other;
    this.othersToDelete = [other];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.othersToDelete = this.filteredOthers.filter(o => o.selected);

    if (this.othersToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد منتجات للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteOthers(): void {
    this.isDeleting = true;

    const deletePromises = this.othersToDelete.map(other =>
      this.otherService.deleteOther(other._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.othersToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'منتج' : 'منتجات'} بنجاح`,
          'success'
        );
        this.loadOthers();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting others:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف المنتجات',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedOther = null;
    this.othersToDelete = [];
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

  getImageUrl(image: any): string {
    if (typeof image === 'string') {
      return image;
    }
    return image?.url || '';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(price);
  }
}
