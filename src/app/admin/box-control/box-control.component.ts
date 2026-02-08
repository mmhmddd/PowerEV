// Key fixes in this component for box-control:
// 1. Import BoxBackendData type from service
// 2. In saveBox(), convert ImageObject[] to string[] before sending
// 3. Handle both new images (base64) and existing images (URLs) correctly
// 4. Implement calculateDiscountedPrice method
// 5. Fix all TypeScript errors

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoxService, BoxBackendData } from '../../core/services/box.service';
import { Box, ImageObject, Offer } from '../../core/models/product.models';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface BoxWithSelection extends Box {
  selected?: boolean;
}

@Component({
  selector: 'app-box-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './box-control.component.html',
  styleUrl: './box-control.component.scss'
})
export class BoxControlComponent implements OnInit {
  // State
  boxes: BoxWithSelection[] = [];
  filteredBoxes: BoxWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedBrand = '';
  selectedSize = '';

  // Modals
  showBoxModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms
  boxForm: Partial<Box> & { _id?: string } = {
    name: '',
    brand: '',
    price: 0,
    stock: 0,
    size: undefined,
    quantity: undefined,
    description: '',
    images: [],
    offer: {
      enabled: false,
      discountPercentage: 0
    }
  };

  // Selected Box
  selectedBox: BoxWithSelection | null = null;
  boxesToDelete: BoxWithSelection[] = [];

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
  sizes: string[] = [];

  constructor(private boxService: BoxService) {}

  ngOnInit(): void {
    this.loadBoxes();
  }

  // ═══════════════════════════════════════════════════════
  // Utility Methods - Calculate Discounted Price
  // ═══════════════════════════════════════════════════════

  calculateDiscountedPrice(price: number, offer: Offer | undefined): number {
    if (!offer || !offer.enabled || !offer.discountPercentage) {
      return price;
    }

    const discount = (price * offer.discountPercentage) / 100;
    return price - discount;
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadBoxes(): void {
    this.isLoading = true;
    this.error = null;

    this.boxService.getAllBoxes().subscribe({
      next: (response) => {
        this.boxes = response.boxes.map(box => ({
          ...box,
          selected: false
        }));
        this.filteredBoxes = [...this.boxes];
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading boxes:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل الصناديق';
        this.isLoading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique brands
    const brandSet = new Set(
      this.boxes
        .map(b => b.brand)
        .filter((br): br is string => br !== undefined && br.trim() !== '')
    );
    this.brands = Array.from(brandSet).sort();

    // Extract unique sizes
    const sizeSet = new Set(
      this.boxes
        .map(b => b.size)
        .filter((s): s is string => s !== undefined && s.trim() !== '')
    );
    this.sizes = Array.from(sizeSet).sort();
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterBoxes(): void {
    this.filteredBoxes = this.boxes.filter(box => {
      // Search filter
      const matchesSearch = !this.searchTerm ||
        box.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (box.description && box.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Brand filter
      const matchesBrand = !this.selectedBrand || box.brand === this.selectedBrand;

      // Size filter
      const matchesSize = !this.selectedSize || box.size === this.selectedSize;

      return matchesSearch && matchesBrand && matchesSize;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredBoxes.filter(b => b.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredBoxes.length > 0 &&
      this.filteredBoxes.every(b => b.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredBoxes.forEach(box => box.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Box
  // ═══════════════════════════════════════════════════════

  openAddBoxModal(): void {
    this.isEditMode = false;
    this.boxForm = {
      name: '',
      brand: '',
      price: 0,
      stock: 0,
      size: undefined,
      quantity: undefined,
      description: '',
      images: [],
      offer: {
        enabled: false,
        discountPercentage: 0
      }
    };
    this.selectedImages = [];
    this.imagePreview = [];
    this.showBoxModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Box
  // ═══════════════════════════════════════════════════════

  openEditBoxModal(box: BoxWithSelection): void {
    this.isEditMode = true;
    this.selectedBox = box;
    this.boxForm = {
      _id: box._id,
      name: box.name,
      brand: box.brand || '',
      price: box.price,
      stock: box.stock,
      size: box.size,
      quantity: box.quantity,
      description: box.description || '',
      images: box.images || [],
      offer: box.offer || {
        enabled: false,
        discountPercentage: 0
      }
    };
    this.selectedImages = [];
    this.imagePreview = box.images?.map(img =>
      typeof img === 'string' ? img : img.url
    ) || [];
    this.showBoxModal = true;
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
  // Save Box (Create or Update) - FIXED VERSION
  // ═══════════════════════════════════════════════════════

  async saveBox(): Promise<void> {
    if (!this.validateBoxForm()) {
      return;
    }

    this.isSaving = true;

    try {
      // Convert images to base64 if new images were selected
      let imagesToSave: string[] = [];

      if (this.selectedImages.length > 0) {
        // New images selected - convert to base64
        imagesToSave = await this.convertImagesToBase64();
      } else if (this.isEditMode && this.boxForm.images) {
        // No new images, keep existing images (extract URLs from ImageObject[])
        imagesToSave = this.boxForm.images.map(img =>
          typeof img === 'string' ? img : (img as ImageObject).url
        );
      }

      // Prepare data for backend (images as string[])
      const boxData: Partial<BoxBackendData> = {
        name: this.boxForm.name,
        brand: this.boxForm.brand || undefined,
        price: this.boxForm.price,
        stock: this.boxForm.stock,
        size: this.boxForm.size || undefined,
        quantity: this.boxForm.quantity || undefined,
        description: this.boxForm.description || undefined,
        images: imagesToSave.length > 0 ? imagesToSave : undefined,
        offer: this.boxForm.offer
      };

      if (this.isEditMode && this.boxForm._id) {
        // Update box
        this.boxService.updateBox(this.boxForm._id, boxData).subscribe({
          next: (response) => {
            this.showToastMessage('تم تحديث الصندوق بنجاح', 'success');
            this.loadBoxes();
            this.closeBoxModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating box:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء تحديث الصندوق',
              'error'
            );
            this.isSaving = false;
          }
        });
      } else {
        // Create box
        this.boxService.createBox(boxData).subscribe({
          next: (response) => {
            this.showToastMessage('تم إضافة الصندوق بنجاح', 'success');
            this.loadBoxes();
            this.closeBoxModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating box:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء إضافة الصندوق',
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('Error in saveBox:', error);
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

  validateBoxForm(): boolean {
    if (!this.boxForm.name || !this.boxForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم الصندوق', 'error');
      return false;
    }

    if (!this.boxForm.price || this.boxForm.price <= 0) {
      this.showToastMessage('يرجى إدخال سعر صحيح', 'error');
      return false;
    }

    if (this.boxForm.stock !== undefined && this.boxForm.stock < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.boxForm.quantity !== undefined && this.boxForm.quantity < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.boxForm.offer?.discountPercentage !== undefined &&
        (this.boxForm.offer.discountPercentage < 0 || this.boxForm.offer.discountPercentage > 100)) {
      this.showToastMessage('نسبة الخصم يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    return true;
  }

  closeBoxModal(): void {
    this.showBoxModal = false;
    this.selectedBox = null;
    this.selectedImages = [];
    this.imagePreview = [];
  }

  // ═══════════════════════════════════════════════════════
  // Delete Box
  // ═══════════════════════════════════════════════════════

  confirmDeleteBox(box: BoxWithSelection): void {
    this.selectedBox = box;
    this.boxesToDelete = [box];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.boxesToDelete = this.filteredBoxes.filter(b => b.selected);

    if (this.boxesToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد صناديق للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteBoxes(): void {
    this.isDeleting = true;

    const deletePromises = this.boxesToDelete.map(box =>
      this.boxService.deleteBox(box._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.boxesToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'صندوق' : 'صناديق'} بنجاح`,
          'success'
        );
        this.loadBoxes();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting boxes:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف الصناديق',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedBox = null;
    this.boxesToDelete = [];
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
