import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { trigger, style, animate, transition } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { GalleryService, GalleryItem } from '../../core/services/gallery.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('zoomIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms ease-in-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class GalleryComponent implements OnInit, OnDestroy {
  isBrowser: boolean;
  selectedImage: GalleryItem | null = null;
  selectedIndex: number = -1;

  galleryItems: GalleryItem[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  private destroy$ = new Subject<void>();
  private keydownHandler!: (e: KeyboardEvent) => void;

  constructor(
    private meta: Meta,
    private title: Title,
    private galleryService: GalleryService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.title.setTitle('معرض الصور - Power EV | صور محطات ومنتجات الشحن');
    this.meta.addTags([
      { name: 'description', content: 'تصفح معرض صور Power EV لمحطات وأجهزة شحن السيارات الكهربائية.' },
      { name: 'keywords', content: 'معرض صور, محطات شحن, سيارات كهربائية, Power EV' },
      { property: 'og:title', content: 'معرض الصور - Power EV' },
      { property: 'og:description', content: 'لقطات من تركيباتنا ومنتجاتنا على أرض الواقع' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' }
    ]);

    this.loadGalleryItems();

    if (this.isBrowser) {
      this.addKeyboardNavigation();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up keyboard listener to avoid memory leaks
    if (this.isBrowser && this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }

    // Restore scroll if component is destroyed while lightbox is open
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  private loadGalleryItems(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.galleryService.getAllGalleryItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.galleryItems) {
            this.galleryItems = response.galleryItems;

            if (this.isBrowser && this.galleryItems.length > 0) {
              this.addStructuredData();
              // Update og:image meta tag with first image
              this.meta.updateTag({ property: 'og:image', content: this.galleryItems[0].image });
            }
          } else {
            this.errorMessage = response.message || 'حدث خطأ أثناء تحميل الصور';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.';
          console.error('Gallery load error:', err);
        }
      });
  }

  private addStructuredData(): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: 'معرض صور Power EV',
      description: 'لقطات من تركيباتنا ومنتجاتنا على أرض الواقع',
      image: this.galleryItems.map(item => ({
        '@type': 'ImageObject',
        url: item.image,
        name: item.title || '',
        description: item.description || ''
      }))
    });
    document.head.appendChild(script);
  }

  private addKeyboardNavigation(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.selectedImage) return;

      switch (e.key) {
        case 'Escape':
          this.closeLightbox();
          break;
        case 'ArrowRight':
          this.nextImage();
          break;
        case 'ArrowLeft':
          this.previousImage();
          break;
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
  }

  openLightbox(item: GalleryItem, index: number): void {
    this.selectedImage = item;
    this.selectedIndex = index;

    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox(): void {
    this.selectedImage = null;
    this.selectedIndex = -1;

    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  nextImage(): void {
    this.selectedIndex = (this.selectedIndex + 1) % this.galleryItems.length;
    this.selectedImage = this.galleryItems[this.selectedIndex];
  }

  previousImage(): void {
    this.selectedIndex =
      (this.selectedIndex - 1 + this.galleryItems.length) % this.galleryItems.length;
    this.selectedImage = this.galleryItems[this.selectedIndex];
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeLightbox();
    }
  }

  retryLoad(): void {
    this.loadGalleryItems();
  }
}
