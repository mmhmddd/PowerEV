// src/app/admin/station-control/station-control.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StationService } from '../../core/services/station.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

// Interface for component use - handles both backend and frontend formats
interface StationWithSelection {
  _id: string;
  name: string;
  price: number;
  quantity: 'in stock' | 'out of stock';
  voltage?: number;
  amperage?: number;
  brand?: string;
  stock?: number;
  offer?: {
    enabled: boolean;
    discountPercentage: number;
  };
  connectorType?: string;
  phase?: string;
  efficiency?: number;
  description?: string;
  images?: any[]; // Can be ImageObject[] from backend or string[] for preview
  createdAt?: string | Date;
  updatedAt?: string | Date;
  selected?: boolean;
}

interface StationBackendData {
  name: string;
  price: number;
  quantity: 'in stock' | 'out of stock';
  voltage?: number;
  amperage?: number;
  brand?: string;
  stock?: number;
  offer?: {
    enabled: boolean;
    discountPercentage: number;
  };
  connectorType?: string;
  phase?: string;
  efficiency?: number;
  description?: string;
  images?: string[];
}

@Component({
  selector: 'app-station-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './station-control.component.html',
  styleUrl: './station-control.component.scss'
})
export class StationControlComponent implements OnInit {
  // State
  stations: StationWithSelection[] = [];
  filteredStations: StationWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedBrand = '';
  selectedConnectorType = '';
  selectedQuantity = '';

  // Modals
  showStationModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms
  stationForm: Partial<StationWithSelection> & { _id?: string } = {
    name: '',
    price: 0,
    quantity: 'in stock',
    voltage: undefined,
    amperage: undefined,
    brand: '',
    stock: 0,
    connectorType: '',
    phase: '',
    efficiency: undefined,
    description: '',
    images: [],
    offer: {
      enabled: false,
      discountPercentage: 0
    }
  };

  // Selected Station
  selectedStation: StationWithSelection | null = null;
  stationsToDelete: StationWithSelection[] = [];

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
  connectorTypes: string[] = [];
  quantityOptions = ['in stock', 'out of stock'];

  constructor(private stationService: StationService) {}

  ngOnInit(): void {
    this.loadStations();
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

loadStations(): void {
  this.isLoading = true;
  this.error = null;

  this.stationService.getAllStations().subscribe({
    next: (response) => {
      this.stations = response.stations.map(station => ({
        ...station,
        selected: false,
        // Convert quantity from number to string format
        quantity: station.quantity > 0 ? 'in stock' : 'out of stock',
        // Convert ImageObject[] to string[] for internal use
        images: station.images?.map((img: any) =>
          typeof img === 'string' ? img : img.url
        ) || [],
        // Ensure offer has proper structure
        offer: station.offer || {
          enabled: false,
          discountPercentage: 0
        }
      }));
      this.filteredStations = [...this.stations];
      this.extractFilterOptions();
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error loading stations:', error);
      this.error = error.error?.message || 'حدث خطأ أثناء تحميل المحطات';
      this.isLoading = false;
    }
  });
}

  extractFilterOptions(): void {
    // Extract unique brands
    const brandSet = new Set(
      this.stations
        .map(s => s.brand)
        .filter((br): br is string => br !== undefined && br.trim() !== '')
    );
    this.brands = Array.from(brandSet).sort();

    // Extract unique connector types
    const connectorSet = new Set(
      this.stations
        .map(s => s.connectorType)
        .filter((ct): ct is string => ct !== undefined && ct.trim() !== '')
    );
    this.connectorTypes = Array.from(connectorSet).sort();
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterStations(): void {
    this.filteredStations = this.stations.filter(station => {
      // Search filter
      const matchesSearch = !this.searchTerm ||
        station.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (station.description && station.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Brand filter
      const matchesBrand = !this.selectedBrand || station.brand === this.selectedBrand;

      // Connector type filter
      const matchesConnector = !this.selectedConnectorType || station.connectorType === this.selectedConnectorType;

      // Quantity filter
      const matchesQuantity = !this.selectedQuantity || station.quantity === this.selectedQuantity;

      return matchesSearch && matchesBrand && matchesConnector && matchesQuantity;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredStations.filter(s => s.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredStations.length > 0 &&
      this.filteredStations.every(s => s.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredStations.forEach(station => station.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Station
  // ═══════════════════════════════════════════════════════

  openAddStationModal(): void {
    this.isEditMode = false;
    this.stationForm = {
      name: '',
      price: 0,
      quantity: 'in stock',
      voltage: undefined,
      amperage: undefined,
      brand: '',
      stock: 0,
      connectorType: '',
      phase: '',
      efficiency: undefined,
      description: '',
      images: [],
      offer: {
        enabled: false,
        discountPercentage: 0
      }
    };
    this.selectedImages = [];
    this.imagePreview = [];
    this.showStationModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Station
  // ═══════════════════════════════════════════════════════

  openEditStationModal(station: StationWithSelection): void {
    this.isEditMode = true;
    this.selectedStation = station;
    this.stationForm = {
      _id: station._id,
      name: station.name,
      price: station.price,
      quantity: station.quantity,
      voltage: station.voltage,
      amperage: station.amperage,
      brand: station.brand || '',
      stock: station.stock || 0,
      connectorType: station.connectorType || '',
      phase: station.phase || '',
      efficiency: station.efficiency,
      description: station.description || '',
      images: station.images || [],
      offer: station.offer || {
        enabled: false,
        discountPercentage: 0
      }
    };
    this.selectedImages = [];
    // Convert images to string URLs for preview
    this.imagePreview = (station.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.url
    );
    this.showStationModal = true;
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
  // Save Station (Create or Update)
  // ═══════════════════════════════════════════════════════

  async saveStation(): Promise<void> {
    if (!this.validateStationForm()) {
      return;
    }

    this.isSaving = true;

    try {
      // Convert images to base64 if new images were selected
      let imagesToSave: string[] = [];

      if (this.selectedImages.length > 0) {
        // New images selected - convert to base64
        imagesToSave = await this.convertImagesToBase64();
      } else if (this.isEditMode && this.stationForm.images && this.stationForm.images.length > 0) {
        // No new images, keep existing images
        // Convert ImageObject[] to string[] if needed
        imagesToSave = this.stationForm.images.map((img: any) =>
          typeof img === 'string' ? img : img.url
        );
      }

      // Prepare data for backend (images as string[])
      const stationData: Partial<StationBackendData> = {
        name: this.stationForm.name,
        price: this.stationForm.price,
        quantity: this.stationForm.quantity,
        voltage: this.stationForm.voltage,
        amperage: this.stationForm.amperage,
        brand: this.stationForm.brand || undefined,
        stock: this.stationForm.stock || 0,
        connectorType: this.stationForm.connectorType || undefined,
        phase: this.stationForm.phase || undefined,
        efficiency: this.stationForm.efficiency,
        description: this.stationForm.description || undefined,
        images: imagesToSave.length > 0 ? imagesToSave : undefined,
        offer: this.stationForm.offer
      };

      if (this.isEditMode && this.stationForm._id) {
        // Update station - cast to any to bypass type checking for the service call
        this.stationService.updateStation(this.stationForm._id, stationData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم تحديث المحطة بنجاح', 'success');
            this.loadStations();
            this.closeStationModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating station:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء تحديث المحطة',
              'error'
            );
            this.isSaving = false;
          }
        });
      } else {
        // Create station - cast to any to bypass type checking for the service call
        this.stationService.createStation(stationData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم إضافة المحطة بنجاح', 'success');
            this.loadStations();
            this.closeStationModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating station:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء إضافة المحطة',
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('Error in saveStation:', error);
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

  validateStationForm(): boolean {
    if (!this.stationForm.name || !this.stationForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم المحطة', 'error');
      return false;
    }

    if (!this.stationForm.price || this.stationForm.price <= 0) {
      this.showToastMessage('يرجى إدخال سعر صحيح', 'error');
      return false;
    }

    if (!this.stationForm.quantity) {
      this.showToastMessage('يرجى اختيار حالة المخزون', 'error');
      return false;
    }

    if (this.stationForm.voltage !== undefined && this.stationForm.voltage < 0) {
      this.showToastMessage('الفولتية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.stationForm.amperage !== undefined && this.stationForm.amperage < 0) {
      this.showToastMessage('التيار لا يمكن أن يكون سالب', 'error');
      return false;
    }

    if (this.stationForm.stock !== undefined && this.stationForm.stock < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.stationForm.efficiency !== undefined &&
        (this.stationForm.efficiency < 0 || this.stationForm.efficiency > 100)) {
      this.showToastMessage('الكفاءة يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    if (this.stationForm.offer?.discountPercentage !== undefined &&
        (this.stationForm.offer.discountPercentage < 0 || this.stationForm.offer.discountPercentage > 100)) {
      this.showToastMessage('نسبة الخصم يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    return true;
  }

  closeStationModal(): void {
    this.showStationModal = false;
    this.selectedStation = null;
    this.selectedImages = [];
    this.imagePreview = [];
  }

  // ═══════════════════════════════════════════════════════
  // Delete Station
  // ═══════════════════════════════════════════════════════

  confirmDeleteStation(station: StationWithSelection): void {
    this.selectedStation = station;
    this.stationsToDelete = [station];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.stationsToDelete = this.filteredStations.filter(s => s.selected);

    if (this.stationsToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد محطات للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteStations(): void {
    this.isDeleting = true;

    const deletePromises = this.stationsToDelete.map(station =>
      this.stationService.deleteStation(station._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.stationsToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'محطة' : 'محطات'} بنجاح`,
          'success'
        );
        this.loadStations();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting stations:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف المحطات',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedStation = null;
    this.stationsToDelete = [];
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

  getStockStatus(quantity: string): string {
    return quantity === 'in stock' ? 'متوفر' : 'غير متوفر';
  }

  getStockClass(quantity: string): string {
    return quantity === 'in stock' ? 'quantity-badge' : 'quantity-badge quantity-badge--out';
  }
}
