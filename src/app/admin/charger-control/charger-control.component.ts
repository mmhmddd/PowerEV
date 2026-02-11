import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChargerService } from '../../core/services/charger.service';
import { Charger, ImageObject } from '../../core/models/product.models';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface ChargerOffer {
  enabled: boolean;
  discountPercentage: number;
}

interface ChargerWithSelection extends Omit<Charger, 'images' | 'quantity'> {
  selected?: boolean;
  images?: (string | ImageObject)[];
  quantity?: number;
}

// Interface for backend data (images as strings)
interface ChargerBackendData {
  name: string;
  price: number;
  quantity: string;
  voltage?: number;
  amperage?: number;
  brand?: string;
  stock?: number;
  offer?: ChargerOffer;
  connectorType?: string;
  phase?: string;
  efficiency?: number;
  description?: string;
  images?: string[];
}

@Component({
  selector: 'app-charger-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './charger-control.component.html',
  styleUrl: './charger-control.component.scss'
})
export class ChargerControlComponent implements OnInit {
  // State
  chargers: ChargerWithSelection[] = [];
  filteredChargers: ChargerWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search and Filter
  searchTerm = '';
  selectedBrand = '';
  selectedPhase = '';
  selectedConnectorType = '';

  // Modals
  showChargerModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms - Using explicit interface to avoid type conflicts
  chargerForm: {
    _id?: string;
    name: string;
    brand: string;
    price: number;
    stock?: number;
    quantity: string;
    voltage?: number;
    amperage?: number;
    connectorType?: string;
    phase?: string;
    efficiency?: number;
    description: string;
    images: (string | ImageObject)[];
    offer: ChargerOffer;
  } = {
    name: '',
    brand: '',
    price: 0,
    stock: 0,
    quantity: 'in stock',
    voltage: undefined,
    amperage: undefined,
    connectorType: undefined,
    phase: undefined,
    efficiency: undefined,
    description: '',
    images: [],
    offer: {
      enabled: false,
      discountPercentage: 0
    }
  };

  // Selected Charger
  selectedCharger: ChargerWithSelection | null = null;
  chargersToDelete: ChargerWithSelection[] = [];

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
  phases: string[] = [];
  connectorTypes: string[] = [];

  constructor(private chargerService: ChargerService) {}

  ngOnInit(): void {
    this.loadChargers();
  }

  // ═══════════════════════════════════════════════════════
  // Utility Methods - Calculate Discounted Price
  // ═══════════════════════════════════════════════════════

  calculateDiscountedPrice(price: number, offer: ChargerOffer | undefined): number {
    if (!offer || !offer.enabled || !offer.discountPercentage) {
      return price;
    }

    const discount = (price * offer.discountPercentage) / 100;
    return price - discount;
  }

  // Helper method to extract offer from Charger
  getOfferValue(charger: ChargerWithSelection): ChargerOffer | undefined {
    const offer = charger.offer as any;
    if (offer && typeof offer === 'object' && 'enabled' in offer) {
      return offer as ChargerOffer;
    }
    return undefined;
  }

  // Helper method to get quantity status
  getQuantityStatus(charger: ChargerWithSelection): 'in stock' | 'out of stock' {
    // Convert number quantity to string status
    if (charger.quantity === undefined || charger.quantity === null) {
      return 'out of stock';
    }

    // If it's already a string, use it
    if (typeof charger.quantity === 'string') {
      return charger.quantity as 'in stock' | 'out of stock';
    }

    // If it's a number, convert: > 0 means in stock
    return (charger.quantity as number) > 0 ? 'in stock' : 'out of stock';
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadChargers(): void {
    this.isLoading = true;
    this.error = null;

    this.chargerService.getAllChargers().subscribe({
      next: (response) => {
        this.chargers = response.chargers.map(charger => ({
          ...charger,
          selected: false,
          images: charger.images || []
        } as unknown as ChargerWithSelection));
        this.filteredChargers = [...this.chargers];
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading chargers:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل الشواحن';
        this.isLoading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique brands
    const brandSet = new Set(
      this.chargers
        .map(c => c.brand)
        .filter((br): br is string => br !== undefined && br.trim() !== '')
    );
    this.brands = Array.from(brandSet).sort();

    // Extract unique phases
    const phaseSet = new Set(
      this.chargers
        .map(c => c.phase)
        .filter((p): p is string => p !== undefined && p.trim() !== '')
    );
    this.phases = Array.from(phaseSet).sort();

    // Extract unique connector types
    const connectorSet = new Set(
      this.chargers
        .map(c => c.connectorType)
        .filter((ct): ct is string => ct !== undefined && ct.trim() !== '')
    );
    this.connectorTypes = Array.from(connectorSet).sort();
  }

  // ═══════════════════════════════════════════════════════
  // Search and Filter
  // ═══════════════════════════════════════════════════════

  filterChargers(): void {
    this.filteredChargers = this.chargers.filter(charger => {
      // Search filter
      const matchesSearch = !this.searchTerm ||
        charger.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (charger.description && charger.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Brand filter
      const matchesBrand = !this.selectedBrand || charger.brand === this.selectedBrand;

      // Phase filter
      const matchesPhase = !this.selectedPhase || charger.phase === this.selectedPhase;

      // Connector type filter
      const matchesConnector = !this.selectedConnectorType || charger.connectorType === this.selectedConnectorType;

      return matchesSearch && matchesBrand && matchesPhase && matchesConnector;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredChargers.filter(c => c.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredChargers.length > 0 &&
      this.filteredChargers.every(c => c.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredChargers.forEach(charger => charger.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Charger
  // ═══════════════════════════════════════════════════════

  openAddChargerModal(): void {
    this.isEditMode = false;
    this.chargerForm = {
      name: '',
      brand: '',
      price: 0,
      stock: 0,
      quantity: 'in stock',
      voltage: undefined,
      amperage: undefined,
      connectorType: undefined,
      phase: undefined,
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
    this.showChargerModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Charger - CRITICAL: Proper image handling
  // ═══════════════════════════════════════════════════════

  openEditChargerModal(charger: ChargerWithSelection): void {
    this.isEditMode = true;
    this.selectedCharger = charger;

    // Extract offer value
    const offerValue = this.getOfferValue(charger) || {
      enabled: false,
      discountPercentage: 0
    };

    // Get quantity as string
    const quantityStatus = this.getQuantityStatus(charger);

    this.chargerForm = {
      _id: charger._id,
      name: charger.name,
      brand: charger.brand || '',
      price: charger.price,
      stock: charger.stock,
      quantity: quantityStatus,
      voltage: charger.voltage,
      amperage: charger.amperage,
      connectorType: charger.connectorType,
      phase: charger.phase,
      efficiency: charger.efficiency,
      description: charger.description || '',
      images: charger.images || [],
      offer: offerValue
    };
    this.selectedImages = [];
    // Extract URLs from existing images for preview
    this.imagePreview = charger.images?.map(img =>
      typeof img === 'string' ? img : img.url
    ) || [];
    this.showChargerModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Image Handling
  // ═══════════════════════════════════════════════════════
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);

      // Add to selected images array
      files.forEach(file => {
        this.selectedImages.push(file);

        // Create preview URL
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
    const removedPreview = this.imagePreview[index];

    // Remove from preview
    this.imagePreview.splice(index, 1);

    // If it's a new image (not an existing URL), remove from selectedImages
    if (removedPreview && removedPreview.startsWith('data:')) {
      // Find and remove the corresponding file from selectedImages
      const newImageIndex = this.imagePreview
        .filter(p => p.startsWith('data:'))
        .indexOf(removedPreview);

      if (newImageIndex !== -1 && newImageIndex < this.selectedImages.length) {
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
  // Save Charger (Create or Update) - FIXED: Backend expects strings
  // ═══════════════════════════════════════════════════════

async saveCharger(): Promise<void> {
    if (!this.validateChargerForm()) {
      return;
    }

    this.isSaving = true;

    try {
      let imagesToSave: string[] = [];

      if (this.isEditMode) {
        // EDIT MODE: Mix existing URLs with new base64 images

        // Get existing image URLs from the original charger
        const existingImageUrls = this.selectedCharger?.images
          ?.map(img => typeof img === 'string' ? img : (img as ImageObject).url)
          .filter(url => url && url.startsWith('http')) || [];

        // Convert newly selected images to base64
        let newBase64Images: string[] = [];
        if (this.selectedImages.length > 0) {
          newBase64Images = await this.convertImagesToBase64();
        }

        // Determine which existing images are still in imagePreview
        const retainedExistingUrls = this.imagePreview.filter(previewUrl =>
          existingImageUrls.includes(previewUrl)
        );

        // Combine retained existing URLs with new base64 images
        imagesToSave = [...retainedExistingUrls, ...newBase64Images];
      } else {
        // CREATE MODE: Only new base64 images
        if (this.selectedImages.length > 0) {
          imagesToSave = await this.convertImagesToBase64();
        }
      }

      // Prepare data for backend (images as string[])
      const chargerData: Partial<ChargerBackendData> = {
        name: this.chargerForm.name,
        brand: this.chargerForm.brand || undefined,
        price: this.chargerForm.price,
        stock: this.chargerForm.stock,
        quantity: this.chargerForm.quantity,
        voltage: this.chargerForm.voltage || undefined,
        amperage: this.chargerForm.amperage || undefined,
        connectorType: this.chargerForm.connectorType || undefined,
        phase: this.chargerForm.phase || undefined,
        efficiency: this.chargerForm.efficiency || undefined,
        description: this.chargerForm.description || undefined,
        images: imagesToSave.length > 0 ? imagesToSave : undefined,
        offer: this.chargerForm.offer
      };

      if (this.isEditMode && this.chargerForm._id) {
        // Update charger
        this.chargerService.updateCharger(this.chargerForm._id, chargerData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم تحديث الشاحن بنجاح', 'success');
            this.loadChargers();
            this.closeChargerModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating charger:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء تحديث الشاحن',
              'error'
            );
            this.isSaving = false;
          }
        });
      } else {
        // Create charger
        this.chargerService.createCharger(chargerData as any).subscribe({
          next: (response) => {
            this.showToastMessage('تم إضافة الشاحن بنجاح', 'success');
            this.loadChargers();
            this.closeChargerModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating charger:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء إضافة الشاحن',
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('Error in saveCharger:', error);
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

  validateChargerForm(): boolean {
    if (!this.chargerForm.name || !this.chargerForm.name.trim()) {
      this.showToastMessage('يرجى إدخال اسم الشاحن', 'error');
      return false;
    }

    if (!this.chargerForm.price || this.chargerForm.price <= 0) {
      this.showToastMessage('يرجى إدخال سعر صحيح', 'error');
      return false;
    }

    if (!this.chargerForm.quantity) {
      this.showToastMessage('يرجى تحديد حالة التوفر', 'error');
      return false;
    }

    if (this.chargerForm.stock !== undefined && this.chargerForm.stock < 0) {
      this.showToastMessage('الكمية لا يمكن أن تكون سالبة', 'error');
      return false;
    }

    if (this.chargerForm.voltage !== undefined && this.chargerForm.voltage < 0) {
      this.showToastMessage('الجهد لا يمكن أن يكون سالباً', 'error');
      return false;
    }

    if (this.chargerForm.amperage !== undefined && this.chargerForm.amperage < 0) {
      this.showToastMessage('التيار لا يمكن أن يكون سالباً', 'error');
      return false;
    }

    if (this.chargerForm.efficiency !== undefined &&
        (this.chargerForm.efficiency < 0 || this.chargerForm.efficiency > 100)) {
      this.showToastMessage('الكفاءة يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    if (this.chargerForm.offer.discountPercentage !== undefined &&
        (this.chargerForm.offer.discountPercentage < 0 || this.chargerForm.offer.discountPercentage > 100)) {
      this.showToastMessage('نسبة الخصم يجب أن تكون بين 0 و 100', 'error');
      return false;
    }

    return true;
  }

  closeChargerModal(): void {
    this.showChargerModal = false;
    this.selectedCharger = null;
    this.selectedImages = [];
    this.imagePreview = [];
  }

  // ═══════════════════════════════════════════════════════
  // Delete Charger
  // ═══════════════════════════════════════════════════════

  confirmDeleteCharger(charger: ChargerWithSelection): void {
    this.selectedCharger = charger;
    this.chargersToDelete = [charger];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.chargersToDelete = this.filteredChargers.filter(c => c.selected);

    if (this.chargersToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد شواحن للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteChargers(): void {
    this.isDeleting = true;

    const deletePromises = this.chargersToDelete.map(charger =>
      this.chargerService.deleteCharger(charger._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.chargersToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'شاحن' : 'شواحن'} بنجاح`,
          'success'
        );
        this.loadChargers();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting chargers:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف الشواحن',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedCharger = null;
    this.chargersToDelete = [];
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
