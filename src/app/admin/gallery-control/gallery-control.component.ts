import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalleryService, GalleryItem } from '../../core/services/gallery.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface GalleryItemWithSelection extends GalleryItem {
  selected?: boolean;
}

@Component({
  selector: 'app-gallery-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './gallery-control.component.html',
  styleUrl: './gallery-control.component.scss'
})
export class GalleryControlComponent implements OnInit {
  // State
  galleryItems: GalleryItemWithSelection[] = [];
  filteredGalleryItems: GalleryItemWithSelection[] = [];
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Search
  searchTerm = '';

  // Modals
  showGalleryModal = false;
  showDeleteModal = false;
  showImageModal = false;
  isEditMode = false;

  // Forms
  galleryForm: {
    _id?: string;
    image: string;
    title: string;
    description: string;
  } = {
    image: '',
    title: '',
    description: ''
  };

  // Selected Gallery Item
  selectedGalleryItem: GalleryItemWithSelection | null = null;
  galleryItemsToDelete: GalleryItemWithSelection[] = [];

  // Image handling
  selectedImage: File | null = null;
  imagePreview: string = '';
  currentImageUrl = '';

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private galleryService: GalleryService) {}

  ngOnInit(): void {
    this.loadGalleryItems();
  }

  // ═══════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════

  loadGalleryItems(): void {
    this.isLoading = true;
    this.error = null;

    this.galleryService.getAllGalleryItems().subscribe({
      next: (response) => {
        this.galleryItems = (response.galleryItems || []).map(item => ({
          ...item,
          selected: false
        }));
        this.filteredGalleryItems = [...this.galleryItems];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading gallery items:', error);
        this.error = error.error?.message || 'حدث خطأ أثناء تحميل الصور';
        this.isLoading = false;
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // Search
  // ═══════════════════════════════════════════════════════

  filterGalleryItems(): void {
    this.filteredGalleryItems = this.galleryItems.filter(item => {
      const matchesSearch = !this.searchTerm ||
        (item.title && item.title.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }

  // ═══════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════

  get selectedCount(): number {
    return this.filteredGalleryItems.filter(item => item.selected).length;
  }

  get allSelected(): boolean {
    return this.filteredGalleryItems.length > 0 &&
      this.filteredGalleryItems.every(item => item.selected);
  }

  toggleSelectAll(): void {
    const newState = !this.allSelected;
    this.filteredGalleryItems.forEach(item => item.selected = newState);
  }

  updateSelectAll(): void {
    // Called when individual checkboxes change
  }

  // ═══════════════════════════════════════════════════════
  // Add Gallery Item
  // ═══════════════════════════════════════════════════════

  openAddGalleryModal(): void {
    this.isEditMode = false;
    this.galleryForm = {
      image: '',
      title: '',
      description: ''
    };
    this.selectedImage = null;
    this.imagePreview = '';
    this.showGalleryModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Edit Gallery Item
  // ═══════════════════════════════════════════════════════

  openEditGalleryModal(item: GalleryItemWithSelection): void {
    this.isEditMode = true;
    this.selectedGalleryItem = item;

    this.galleryForm = {
      _id: item._id,
      image: item.image,
      title: item.title || '',
      description: item.description || ''
    };
    this.selectedImage = null;
    this.imagePreview = item.image;
    this.showGalleryModal = true;
  }

  // ═══════════════════════════════════════════════════════
  // Image Handling
  // ═══════════════════════════════════════════════════════

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedImage = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.imagePreview = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imagePreview = '';
    this.selectedImage = null;
    this.galleryForm.image = '';
  }

  openImageViewer(imageUrl: string): void {
    this.currentImageUrl = imageUrl;
    this.showImageModal = true;
  }

  closeImageViewer(): void {
    this.showImageModal = false;
  }

  // ═══════════════════════════════════════════════════════
  // Save Gallery Item
  // ═══════════════════════════════════════════════════════

  async saveGalleryItem(): Promise<void> {
    if (!this.validateGalleryForm()) {
      return;
    }

    this.isSaving = true;

    try {
      let imageToSave = '';

      if (this.selectedImage) {
        // New image selected - convert to base64
        imageToSave = await this.convertImageToBase64(this.selectedImage);
      } else if (this.isEditMode && this.galleryForm.image) {
        // No new image in edit mode - keep existing image
        imageToSave = this.galleryForm.image;
      }

      // Prepare data for backend
      const galleryData = {
        image: imageToSave,
        title: this.galleryForm.title || '',
        description: this.galleryForm.description || ''
      };

      if (this.isEditMode && this.galleryForm._id) {
        // Update gallery item
        this.galleryService.updateGalleryItem(this.galleryForm._id, galleryData).subscribe({
          next: (response) => {
            this.showToastMessage('تم تحديث الصورة بنجاح', 'success');
            this.loadGalleryItems();
            this.closeGalleryModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating gallery item:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء تحديث الصورة',
              'error'
            );
            this.isSaving = false;
          }
        });
      } else {
        // Create gallery item
        this.galleryService.createGalleryItem(galleryData).subscribe({
          next: (response) => {
            this.showToastMessage('تم إضافة الصورة بنجاح', 'success');
            this.loadGalleryItems();
            this.closeGalleryModal();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating gallery item:', error);
            this.showToastMessage(
              error.error?.message || 'حدث خطأ أثناء إضافة الصورة',
              'error'
            );
            this.isSaving = false;
          }
        });
      }
    } catch (error) {
      console.error('Error in saveGalleryItem:', error);
      this.showToastMessage('حدث خطأ أثناء معالجة الصورة', 'error');
      this.isSaving = false;
    }
  }

  async convertImageToBase64(file: File): Promise<string> {
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
  }

  validateGalleryForm(): boolean {
    if (!this.imagePreview && !this.galleryForm.image) {
      this.showToastMessage('يرجى اختيار صورة', 'error');
      return false;
    }

    return true;
  }

  closeGalleryModal(): void {
    this.showGalleryModal = false;
    this.selectedGalleryItem = null;
    this.selectedImage = null;
    this.imagePreview = '';
  }

  // ═══════════════════════════════════════════════════════
  // Delete Gallery Item
  // ═══════════════════════════════════════════════════════

  confirmDeleteGalleryItem(item: GalleryItemWithSelection): void {
    this.selectedGalleryItem = item;
    this.galleryItemsToDelete = [item];
    this.showDeleteModal = true;
  }

  confirmBulkDelete(): void {
    this.galleryItemsToDelete = this.filteredGalleryItems.filter(item => item.selected);

    if (this.galleryItemsToDelete.length === 0) {
      this.showToastMessage('يرجى تحديد صور للحذف', 'error');
      return;
    }

    this.showDeleteModal = true;
  }

  deleteGalleryItems(): void {
    this.isDeleting = true;

    const deletePromises = this.galleryItemsToDelete.map(item =>
      this.galleryService.deleteGalleryItem(item._id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        const count = this.galleryItemsToDelete.length;
        this.showToastMessage(
          `تم حذف ${count} ${count === 1 ? 'صورة' : 'صور'} بنجاح`,
          'success'
        );
        this.loadGalleryItems();
        this.closeDeleteModal();
        this.isDeleting = false;
      })
      .catch((error) => {
        console.error('Error deleting gallery items:', error);
        this.showToastMessage(
          error.error?.message || 'حدث خطأ أثناء حذف الصور',
          'error'
        );
        this.isDeleting = false;
      });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedGalleryItem = null;
    this.galleryItemsToDelete = [];
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

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
