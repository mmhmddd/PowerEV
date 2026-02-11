// src/app/admin/cable-control/cable-control.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CableService, CableBackendData, Cable } from '../../core/services/cable.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface CableWithSelection extends Cable {
  selected?: boolean;
}

@Component({
  selector: 'app-cable-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './cable-control.component.html',
  styleUrl: './cable-control.component.scss'
})
export class CableControlComponent implements OnInit {
  // State
  cables: CableWithSelection[] = [];
  filteredCables: CableWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedBrand = '';
  selectedType = '';
  selectedQuantity = '';

  // Modals
  showCableModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms
  cableForm: Partial<Cable> & { _id?: string } = {
    name: '',
    price: 0,
    quantity: 'in stock',
    type: '',
    brand: '',
    connectorFrom: '',
    connectorTo: '',
    stock: 0,
    voltage: undefined,
    current: undefined,
    phase: '',
    cableLength: undefined,
    wireGauge: '',
    description: '',
    images: [],
    offer: {
      enabled: false,
      discountPercentage: 0
    }
  };

  // Selected Cable
  selectedCable: CableWithSelection | null = null;
  cablesToDelete: CableWithSelection[] = [];

  // Image handling - FIXED
  selectedImages: File[] = [];
  imagePreview: string[] = [];
  currentImageIndex = 0;
  imagesChanged = false; // Track if images were modified

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Lists for filters
  brands: string[] = [];
  types: string[] = [];
  quantityOptions = ['in stock', 'out of stock'];

  constructor(private cableService: CableService) {}

  ngOnInit(): void {
    this.loadCables();
  }

  // ═══════════════════════════════════════════════════════
  // Utility Methods - Calculate Discounted Price
  // ═══════════════════════════════════════════════════════

  calculateDiscountedPrice(price: number, offer: { enabled: boolean; discountPercentage: number } | undefined): number {
    if (!offer || !offer.enabled || !offer.discountPercentage) {
      return price;
    }

    const discount = (price * offer.discountPercentage) / 100;
    return price - discount;
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadCables(): void {
    this.isLoading = true;
    this.error = null;

    this.cableService.getAllCables().subscribe({
      next: (response) => {
        this.cables = response.cables.map(cable => ({
          ...cable,
          selected: false
        }));
        this.filteredCables = [...this.cables];
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cables:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل الكابلات';
        this.isLoading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique brands
    const brandSet = new Set(
      this.cables
        .map(c => c.brand)
        .filter((br): br is string => br !== undefined && br.trim() !== '')
    );
    this.brands = Array.from(brandSet).sort();

    // Extract unique types
    const typeSet = new Set(
      this.cables
        .map(c => c.type)
        .filter((t): t is string => t !== undefined && t.trim() !== '')
    );
    this.types = Array.from(typeSet).sort();
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterCables(): void {
    this.filteredCables = this.cables.filter(cable => {
      // Search filter
      const matchesSearch = !this.searchTerm ||
        cable.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (cable.description && cable.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Brand filter
      const matchesBrand = !this.selectedBrand || cable.brand === this.selectedBrand;

      // Type filter
      const matchesType = !this.selectedType || cable.type === this.selectedType;

      // Quantity filter
      const matchesQuantity = !this.selectedQuantity || cable.quantity === this.selectedQuantity;

      return matchesSearch && matchesBrand && matchesType && matchesQuantity;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredCables.filter(c => c.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredCables.length > 0 &&
      this.filteredCables.every(c => c.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredCables.forEach(cable => cable.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Cable
  // ═══════════════════════════════════════════════════════

  openAddCableModal(): void {
    this.isEditMode = false;
    this.imagesChanged = false; // Reset flag
    this.cableForm = {
      name: '',
      price: 0,
      quantity: 'in stock',
      type: '',
      brand: '',
      connectorFrom: '',
      connectorTo: '',
      stock: 0,
      voltage: undefined,
      current: undefined,
      phase: '',
      cableLength: undefined,
      wireGauge: '',
      description: '',
      images: [],
      offer: {
        enabled: false,
        discountPercentage: 0
      }
    };
    this.selectedImages = [];
    this.imagePreview = [];
    this.showCableModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Cable
  // ═══════════════════════════════════════════════════════

  openEditCableModal(cable: CableWithSelection): void {
    this.isEditMode = true;
    this.imagesChanged = false; // Reset flag
    this.selectedCable = cable;
    this.cableForm = {
      _id: cable._id,
      name: cable.name,
      price: cable.price,
      quantity: cable.quantity,
      type: cable.type || '',
      brand: cable.brand || '',
      connectorFrom: cable.connectorFrom || '',
      connectorTo: cable.connectorTo || '',
      stock: cable.stock || 0,
      voltage: cable.voltage,
      current: cable.current,
      phase: cable.phase || '',
      cableLength: cable.cableLength,
      wireGauge: cable.wireGauge || '',
      description: cable.description || '',
      images: cable.images || [],
      offer: cable.offer || {
        enabled: false,
        discountPercentage: 0
      }
    };
    this.selectedImages = [];
    this.imagePreview = cable.images || [];
    this.showCableModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Image Handling - FIXED
  // ═══════════════════════════════════════════════════════

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.selectedImages.push(...files);
      this.imagesChanged = true; // Mark images as changed

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

    // Only remove from selectedImages if it exists there
    if (index < this.selectedImages.length) {
      this.selectedImages.splice(index, 1);
    }

    this.imagesChanged = true; // Mark images as changed
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
  // Save Cable (Create or Update) - FIXED
  // ═══════════════════════════════════════════════════════

  async saveCable(): Promise<void> {
    if (!this.validateCableForm()) {
      return;
    }

    this.isSaving = true;

    try {
      // Prepare data for backend
      const cableData: Partial<CableBackendData> = {
        name: this.cableForm.name,
        price: this.cableForm.price,
        quantity: this.cableForm.quantity,
        type: this.cableForm.type || undefined,
        brand: this.cableForm.brand || undefined,
        connectorFrom: this.cableForm.connectorFrom || undefined,
        connectorTo: this.cableForm.connectorTo || undefined,
        stock: this.cableForm.stock || undefined,
        voltage: this.cableForm.voltage || undefined,
        current: this.cableForm.current || undefined,
        phase: this.cableForm.phase || undefined,
        cableLength: this.cableForm.cableLength || undefined,
        wireGauge: this.cableForm.wireGauge || undefined,
        description: this.cableForm.description || undefined,
        offer: this.cableForm.offer
      };

      // FIXED: Only include images if they were changed
      if (this.imagesChanged) {
        if (this.selectedImages.length > 0) {
          // New images were selected - convert to base64
          const imagesToSave = await this.convertImagesToBase64();
          cableData.images = imagesToSave;
        } else {
          // Images were cleared
          cableData.images = [];
        }
      }
      // If !imagesChanged, don't include images field at all (undefined)
      // This tells the backend to keep existing images

      if (this.isEditMode && this.cableForm._id) {
        // Update cable
        this.cableService.updateCable(this.cableForm._id, cableData).subscribe({
          next: (response) => {
            this.showToastMessage('تم تحديث الكابل بنجاح', 'success');
            this.loadCables();
            this.closeCableModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating cable:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء تحديث الكابل',
              'error'
            );
            this.isSaving = false;
          }
        });
      } else {
        // Create cable
        this.cableService.createCable(cableData).subscribe({
          next: (response) => {
            this.showToastMessage('تم إضافة الكابل بنجاح', 'success');
            this.loadCables();
            this.closeCableModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating cable:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء إضافة الكابل',
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('Error in saveCable:', error);
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

  validateCableForm(): boolean {
    if (!this.cableForm.name || !this.cableForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم الكابل', 'error');
      return false;
    }

    if (!this.cableForm.price || this.cableForm.price <= 0) {
      this.showToastMessage('يرجى إدخال سعر صحيح', 'error');
      return false;
    }

    if (!this.cableForm.quantity) {
      this.showToastMessage('يرجى اختيار حالة المخزون', 'error');
      return false;
    }

    if (this.cableForm.stock !== undefined && this.cableForm.stock < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.cableForm.voltage !== undefined && this.cableForm.voltage < 0) {
      this.showToastMessage('الفولتية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.cableForm.current !== undefined && this.cableForm.current < 0) {
      this.showToastMessage('التيار لا يمكن أن يكون سالب', 'error');
      return false;
    }

    if (this.cableForm.cableLength !== undefined && this.cableForm.cableLength < 0) {
      this.showToastMessage('طول الكابل لا يمكن أن يكون سالب', 'error');
      return false;
    }

    if (this.cableForm.offer?.discountPercentage !== undefined &&
        (this.cableForm.offer.discountPercentage < 0 || this.cableForm.offer.discountPercentage > 100)) {
      this.showToastMessage('نسبة الخصم يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    return true;
  }

  closeCableModal(): void {
    this.showCableModal = false;
    this.selectedCable = null;
    this.selectedImages = [];
    this.imagePreview = [];
    this.imagesChanged = false;
  }

  // ═══════════════════════════════════════════════════════
  // Delete Cable
  // ═══════════════════════════════════════════════════════

  confirmDeleteCable(cable: CableWithSelection): void {
    this.selectedCable = cable;
    this.cablesToDelete = [cable];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.cablesToDelete = this.filteredCables.filter(c => c.selected);

    if (this.cablesToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد كابلات للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteCables(): void {
    this.isDeleting = true;

    const deletePromises = this.cablesToDelete.map(cable =>
      this.cableService.deleteCable(cable._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.cablesToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'كابل' : 'كابلات'} بنجاح`,
          'success'
        );
        this.loadCables();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting cables:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف الكابلات',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedCable = null;
    this.cablesToDelete = [];
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

  getConnectorDisplay(cable: Cable): string {
    if (cable.connectorFrom && cable.connectorTo) {
      return `${cable.connectorFrom} → ${cable.connectorTo}`;
    } else if (cable.connectorFrom) {
      return cable.connectorFrom;
    } else if (cable.connectorTo) {
      return cable.connectorTo;
    }
    return '-';
  }
}
