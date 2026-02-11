// src/app/admin/breaker-control/breaker-control.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakerService, BreakerBackendData, Breaker } from '../../core/services/breaker.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface BreakerWithSelection extends Breaker {
  selected?: boolean;
}

@Component({
  selector: 'app-breaker-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './breaker-control.component.html',
  styleUrl: './breaker-control.component.scss'
})
export class BreakerControlComponent implements OnInit {
  // State
  breakers: BreakerWithSelection[] = [];
  filteredBreakers: BreakerWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedBrand = '';
  selectedType = '';

  // Modals
  showBreakerModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms
  breakerForm: Partial<Breaker> & { _id?: string } = {
    name: '',
    brand: '',
    price: 0,
    stock: 0,
    quantity: undefined,
    description: '',
    images: [],
    offer: undefined,
    ampere: undefined,
    voltage: undefined,
    type: ''
  };

  // Selected Breaker
  selectedBreaker: BreakerWithSelection | null = null;
  breakersToDelete: BreakerWithSelection[] = [];

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

  constructor(private breakerService: BreakerService) {}

  ngOnInit(): void {
    this.loadBreakers();
  }

  // ═══════════════════════════════════════════════════════
  // Utility Methods - Calculate Discounted Price
  // ═══════════════════════════════════════════════════════

  calculateDiscountedPrice(price: number, offer: number | undefined): number {
    if (!offer || offer <= 0) {
      return price;
    }

    const discount = (price * offer) / 100;
    return price - discount;
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadBreakers(): void {
    this.isLoading = true;
    this.error = null;

    this.breakerService.getAllBreakers().subscribe({
      next: (response) => {
        this.breakers = response.breakers.map(breaker => ({
          ...breaker,
          selected: false
        }));
        this.filteredBreakers = [...this.breakers];
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading breakers:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل القواطع';
        this.isLoading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique brands
    const brandSet = new Set(
      this.breakers
        .map(b => b.brand)
        .filter((br): br is string => br !== undefined && br.trim() !== '')
    );
    this.brands = Array.from(brandSet).sort();

    // Extract unique types
    const typeSet = new Set(
      this.breakers
        .map(b => b.type)
        .filter((t): t is string => t !== undefined && t.trim() !== '')
    );
    this.types = Array.from(typeSet).sort();
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterBreakers(): void {
    this.filteredBreakers = this.breakers.filter(breaker => {
      // Search filter
      const matchesSearch = !this.searchTerm ||
        breaker.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (breaker.description && breaker.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Brand filter
      const matchesBrand = !this.selectedBrand || breaker.brand === this.selectedBrand;

      // Type filter
      const matchesType = !this.selectedType || breaker.type === this.selectedType;

      return matchesSearch && matchesBrand && matchesType;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredBreakers.filter(b => b.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredBreakers.length > 0 &&
      this.filteredBreakers.every(b => b.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredBreakers.forEach(breaker => breaker.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Breaker
  // ═══════════════════════════════════════════════════════

  openAddBreakerModal(): void {
    this.isEditMode = false;
    this.breakerForm = {
      name: '',
      brand: '',
      price: 0,
      stock: 0,
      quantity: undefined,
      description: '',
      images: [],
      offer: undefined,
      ampere: undefined,
      voltage: undefined,
      type: ''
    };
    this.selectedImages = [];
    this.imagePreview = [];
    this.showBreakerModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Breaker - FIXED: Proper image handling
  // ═══════════════════════════════════════════════════════

  openEditBreakerModal(breaker: BreakerWithSelection): void {
    this.isEditMode = true;
    this.selectedBreaker = breaker;
    this.breakerForm = {
      _id: breaker._id,
      name: breaker.name,
      brand: breaker.brand || '',
      price: breaker.price,
      stock: breaker.stock,
      quantity: breaker.quantity,
      description: breaker.description || '',
      images: breaker.images || [],
      offer: breaker.offer,
      ampere: breaker.ampere,
      voltage: breaker.voltage,
      type: breaker.type || ''
    };
    this.selectedImages = [];
    // Set imagePreview with existing images
    this.imagePreview = breaker.images || [];
    this.showBreakerModal = true;
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
    const existingImageCount = this.isEditMode && this.breakerForm.images
      ? this.breakerForm.images.length
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
  // Save Breaker (Create or Update) - FIXED: Proper image handling
  // ═══════════════════════════════════════════════════════

  async saveBreaker(): Promise<void> {
    if (!this.validateBreakerForm()) {
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
      const breakerData: Partial<BreakerBackendData> = {
        name: this.breakerForm.name,
        brand: this.breakerForm.brand || undefined,
        price: this.breakerForm.price,
        stock: this.breakerForm.stock,
        quantity: this.breakerForm.quantity || undefined,
        description: this.breakerForm.description || undefined,
        // Always send images array (even if empty) to properly handle deletions
        images: imagesToSave,
        offer: this.breakerForm.offer || undefined,
        ampere: this.breakerForm.ampere || undefined,
        voltage: this.breakerForm.voltage || undefined,
        type: this.breakerForm.type || undefined
      };

      if (this.isEditMode && this.breakerForm._id) {
        // Update breaker
        this.breakerService.updateBreaker(this.breakerForm._id, breakerData).subscribe({
          next: (response) => {
            this.showToastMessage('تم تحديث القاطع بنجاح', 'success');
            this.loadBreakers();
            this.closeBreakerModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating breaker:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء تحديث القاطع',
              'error'
            );
            this.isSaving = false;
          }
        });
      } else {
        // Create breaker
        this.breakerService.createBreaker(breakerData).subscribe({
          next: (response) => {
            this.showToastMessage('تم إضافة القاطع بنجاح', 'success');
            this.loadBreakers();
            this.closeBreakerModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating breaker:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء إضافة القاطع',
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('Error in saveBreaker:', error);
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

  validateBreakerForm(): boolean {
    if (!this.breakerForm.name || !this.breakerForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم القاطع', 'error');
      return false;
    }

    if (!this.breakerForm.price || this.breakerForm.price <= 0) {
      this.showToastMessage('يرجى إدخال سعر صحيح', 'error');
      return false;
    }

    if (this.breakerForm.stock !== undefined && this.breakerForm.stock < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.breakerForm.quantity !== undefined && this.breakerForm.quantity < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.breakerForm.offer !== undefined &&
        (this.breakerForm.offer < 0 || this.breakerForm.offer > 100)) {
      this.showToastMessage('نسبة الخصم يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    if (this.breakerForm.ampere !== undefined && this.breakerForm.ampere < 0) {
      this.showToastMessage('الأمبير لا يمكن أن يكون سالب', 'error');
      return false;
    }

    if (this.breakerForm.voltage !== undefined && this.breakerForm.voltage < 0) {
      this.showToastMessage('الفولتية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    return true;
  }

  closeBreakerModal(): void {
    this.showBreakerModal = false;
    this.selectedBreaker = null;
    this.selectedImages = [];
    this.imagePreview = [];
  }

  // ═══════════════════════════════════════════════════════
  // Delete Breaker
  // ═══════════════════════════════════════════════════════

  confirmDeleteBreaker(breaker: BreakerWithSelection): void {
    this.selectedBreaker = breaker;
    this.breakersToDelete = [breaker];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.breakersToDelete = this.filteredBreakers.filter(b => b.selected);

    if (this.breakersToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد قواطع للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteBreakers(): void {
    this.isDeleting = true;

    const deletePromises = this.breakersToDelete.map(breaker =>
      this.breakerService.deleteBreaker(breaker._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.breakersToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'قاطع' : 'قواطع'} بنجاح`,
          'success'
        );
        this.loadBreakers();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting breakers:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف القواطع',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedBreaker = null;
    this.breakersToDelete = [];
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

  getImageUrl(image: string): string {
    return image;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(price);
  }
}
