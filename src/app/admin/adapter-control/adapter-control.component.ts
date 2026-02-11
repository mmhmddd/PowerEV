import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdapterService, AdapterBackendData } from '../../core/services/adapter.service';
import { Adapter, ImageObject } from '../../core/models/product.models';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface AdapterWithSelection extends Adapter {
  selected?: boolean;
}

@Component({
  selector: 'app-adapter-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './adapter-control.component.html',
  styleUrl: './adapter-control.component.scss'
})
export class AdapterControlComponent implements OnInit {
  // State
  adapters: AdapterWithSelection[] = [];
  filteredAdapters: AdapterWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedBrand = '';
  selectedType = '';
  stockFilter = ''; // New stock filter

  // Modals
  showAdapterModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms
  adapterForm: Partial<Adapter> & { _id?: string } = {
    name: '',
    type: '',
    brand: '',
    price: 0,
    stock: 0,
    efficiency: undefined,
    voltage: undefined,
    current: undefined,
    description: '',
    images: []
  };

  // Selected Adapter
  selectedAdapter: AdapterWithSelection | null = null;
  adaptersToDelete: AdapterWithSelection[] = [];

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
    { label: 'غير متوفر', value: 'out-of-stock' }
  ];

  constructor(private adapterService: AdapterService) {}

  ngOnInit(): void {
    this.loadAdapters();
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadAdapters(): void {
    this.isLoading = true;
    this.error = null;

    this.adapterService.getAllAdapters().subscribe({
      next: (response) => {
        this.adapters = response.adapters.map(adapter => ({
          ...adapter,
          selected: false
        }));
        this.filteredAdapters = [...this.adapters];
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading adapters:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل المحولات';
        this.isLoading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique brands
    const brandSet = new Set(
      this.adapters
        .map(a => a.brand)
        .filter((b): b is string => b !== undefined && b.trim() !== '')
    );
    this.brands = Array.from(brandSet).sort();

    // Extract unique types
    const typeSet = new Set(
      this.adapters
        .map(a => a.type)
        .filter((t): t is string => t !== undefined && t.trim() !== '')
    );
    this.types = Array.from(typeSet).sort();
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterAdapters(): void {
    this.filteredAdapters = this.adapters.filter(adapter => {
      // Search filter
      const matchesSearch = !this.searchTerm ||
        adapter.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (adapter.description && adapter.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Brand filter
      const matchesBrand = !this.selectedBrand || adapter.brand === this.selectedBrand;

      // Type filter
      const matchesType = !this.selectedType || adapter.type === this.selectedType;

      // Stock filter
      let matchesStock = true;
      if (this.stockFilter === 'in-stock') {
        matchesStock = adapter.stock > 0;
      } else if (this.stockFilter === 'out-of-stock') {
        matchesStock = adapter.stock === 0;
      }

      return matchesSearch && matchesBrand && matchesType && matchesStock;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredAdapters.filter(a => a.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredAdapters.length > 0 &&
      this.filteredAdapters.every(a => a.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredAdapters.forEach(adapter => adapter.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Adapter
  // ═══════════════════════════════════════════════════════

  openAddAdapterModal(): void {
    this.isEditMode = false;
    this.adapterForm = {
      name: '',
      type: '',
      brand: '',
      price: 0,
      stock: 0,
      efficiency: undefined,
      voltage: undefined,
      current: undefined,
      description: '',
      images: []
    };
    this.selectedImages = [];
    this.imagePreview = [];
    this.showAdapterModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Adapter
  // ═══════════════════════════════════════════════════════

  openEditAdapterModal(adapter: AdapterWithSelection): void {
    this.isEditMode = true;
    this.selectedAdapter = adapter;
    this.adapterForm = {
      _id: adapter._id,
      name: adapter.name,
      type: adapter.type || '',
      brand: adapter.brand || '',
      price: adapter.price,
      stock: adapter.stock,
      efficiency: adapter.efficiency,
      voltage: adapter.voltage,
      current: adapter.current,
      description: adapter.description || '',
      images: adapter.images || []
    };
    this.selectedImages = [];
    this.imagePreview = adapter.images?.map(img =>
      typeof img === 'string' ? img : img.url
    ) || [];
    this.showAdapterModal = true;
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
  // Save Adapter (Create or Update)
  // ═══════════════════════════════════════════════════════

  async saveAdapter(): Promise<void> {
    if (!this.validateAdapterForm()) {
      return;
    }

    this.isSaving = true;

    // Convert images to base64 if new images were selected
    let imagesToSave: string[] = [];
    if (this.selectedImages.length > 0) {
      const base64Images = await this.convertImagesToBase64();
      imagesToSave = base64Images;
    } else if (this.isEditMode && this.adapterForm.images) {
      // Keep existing images if no new images selected
      imagesToSave = this.adapterForm.images.map((img: any) =>
        typeof img === 'string' ? img : img.url
      );
    }

    const adapterData: Partial<AdapterBackendData> = {
      name: this.adapterForm.name,
      type: this.adapterForm.type || undefined,
      brand: this.adapterForm.brand || undefined,
      price: this.adapterForm.price,
      stock: this.adapterForm.stock,
      efficiency: this.adapterForm.efficiency || undefined,
      voltage: this.adapterForm.voltage || undefined,
      current: this.adapterForm.current || undefined,
      description: this.adapterForm.description || undefined,
      images: imagesToSave.length > 0 ? imagesToSave : undefined
    };

    if (this.isEditMode && this.adapterForm._id) {
      // Update adapter
      this.adapterService.updateAdapter(this.adapterForm._id, adapterData).subscribe({
        next: (response) => {
          this.showToastMessage('تم تحديث المحول بنجاح', 'success');
          this.loadAdapters();
          this.closeAdapterModal();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error updating adapter:', error);
          this.showToastMessage(
            error.error?.message || 'حدث خطأ أثناء تحديث المحول',
            'error'
          );
          this.isSaving = false;
        }
      });
    } else {
      // Create adapter
      this.adapterService.createAdapter(adapterData).subscribe({
        next: (response) => {
          this.showToastMessage('تم إضافة المحول بنجاح', 'success');
          this.loadAdapters();
          this.closeAdapterModal();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error creating adapter:', error);
          this.showToastMessage(
            error.error?.message || 'حدث خطأ أثناء إضافة المحول',
            'error'
          );
          this.isSaving = false;
        }
      });
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

  validateAdapterForm(): boolean {
    if (!this.adapterForm.name || !this.adapterForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم المحول', 'error');
      return false;
    }

    if (!this.adapterForm.price || this.adapterForm.price <= 0) {
      this.showToastMessage('يرجى إدخال سعر صحيح', 'error');
      return false;
    }

    if (this.adapterForm.stock !== undefined && this.adapterForm.stock < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.adapterForm.efficiency !== undefined &&
        (this.adapterForm.efficiency < 0 || this.adapterForm.efficiency > 100)) {
      this.showToastMessage('الكفاءة يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    return true;
  }

  closeAdapterModal(): void {
    this.showAdapterModal = false;
    this.selectedAdapter = null;
    this.selectedImages = [];
    this.imagePreview = [];
  }

  // ═══════════════════════════════════════════════════════
  // Delete Adapter
  // ═══════════════════════════════════════════════════════

  confirmDeleteAdapter(adapter: AdapterWithSelection): void {
    this.selectedAdapter = adapter;
    this.adaptersToDelete = [adapter];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.adaptersToDelete = this.filteredAdapters.filter(a => a.selected);

    if (this.adaptersToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد محولات للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteAdapters(): void {
    this.isDeleting = true;

    const deletePromises = this.adaptersToDelete.map(adapter =>
      this.adapterService.deleteAdapter(adapter._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.adaptersToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'محول' : 'محولات'} بنجاح`,
          'success'
        );
        this.loadAdapters();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting adapters:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف المحولات',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedAdapter = null;
    this.adaptersToDelete = [];
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

  getStockStatus(stock: number): string {
    return stock > 0 ? 'متوفر' : 'غير متوفر';
  }

  getStockClass(stock: number): string {
    return stock > 0 ? 'stock-badge stock-badge--in' : 'stock-badge stock-badge--out';
  }
}
