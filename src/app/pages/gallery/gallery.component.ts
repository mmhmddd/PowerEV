import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { trigger, style, animate, transition } from '@angular/animations';

interface GalleryImage {
  src: string;
  alt: string;
  title?: string;
}

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
export class GalleryComponent implements OnInit {
  isBrowser: boolean;
  selectedImage: GalleryImage | null = null;
  selectedIndex: number = -1;

  galleryImages: GalleryImage[] = [
    {
      src: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800',
      alt: 'محطة شحن السيارات الكهربائية - Power EV',
      title: 'محطة شحن عامة'
    },
    {
      src: 'https://images.unsplash.com/photo-1646719000106-963507639034?auto=format&fit=crop&q=80&w=800',
      alt: 'شاحن سيارة كهربائية حديث',
      title: 'شاحن منزلي'
    },
    {
      src: 'https://images.unsplash.com/photo-1662446759714-38641957247e?auto=format&fit=crop&q=80&w=800',
      alt: 'سيارة كهربائية أثناء الشحن',
      title: 'شحن سريع'
    },
    {
      src: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800',
      alt: 'تركيب محطة شحن كهربائية',
      title: 'تركيبات احترافية'
    },
    {
      src: 'https://images.unsplash.com/photo-1565514020176-db79364b9643?auto=format&fit=crop&q=80&w=800',
      alt: 'شاحن سيارة كهربائية متطور',
      title: 'أحدث التقنيات'
    },
    {
      src: 'https://images.unsplash.com/photo-1566093097221-ac2335b09e70?auto=format&fit=crop&q=80&w=800',
      alt: 'محطة شحن Power EV',
      title: 'خدمات متكاملة'
    }
  ];

  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // SEO Meta tags
    this.title.setTitle('معرض الصور - Power EV | صور محطات ومنتجات الشحن');
    this.meta.addTags([
      { name: 'description', content: 'تصفح معرض صور Power EV لمحطات وأجهزة شحن السيارات الكهربائية. شاهد تركيباتنا ومنتجاتنا على أرض الواقع.' },
      { name: 'keywords', content: 'معرض صور, محطات شحن, سيارات كهربائية, Power EV, صور تركيبات' },
      { property: 'og:title', content: 'معرض الصور - Power EV' },
      { property: 'og:description', content: 'لقطات من تركيباتنا ومنتجاتنا على أرض الواقع' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: this.galleryImages[0].src },
      { name: 'twitter:card', content: 'summary_large_image' }
    ]);

    // Add keyboard navigation
    if (this.isBrowser) {
      this.addKeyboardNavigation();
      this.addStructuredData();
    }
  }

  private addStructuredData(): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: 'معرض صور Power EV',
      description: 'لقطات من تركيباتنا ومنتجاتنا على أرض الواقع',
      image: this.galleryImages.map(img => ({
        '@type': 'ImageObject',
        url: img.src,
        description: img.alt
      }))
    });
    document.head.appendChild(script);
  }

  private addKeyboardNavigation(): void {
    document.addEventListener('keydown', (e) => {
      if (this.selectedImage) {
        if (e.key === 'Escape') {
          this.closeLightbox();
        } else if (e.key === 'ArrowRight') {
          this.nextImage();
        } else if (e.key === 'ArrowLeft') {
          this.previousImage();
        }
      }
    });
  }

  openLightbox(image: GalleryImage, index: number): void {
    this.selectedImage = image;
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
    if (this.selectedIndex < this.galleryImages.length - 1) {
      this.selectedIndex++;
      this.selectedImage = this.galleryImages[this.selectedIndex];
    } else {
      // Loop back to first image
      this.selectedIndex = 0;
      this.selectedImage = this.galleryImages[0];
    }
  }

  previousImage(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.selectedImage = this.galleryImages[this.selectedIndex];
    } else {
      // Loop to last image
      this.selectedIndex = this.galleryImages.length - 1;
      this.selectedImage = this.galleryImages[this.selectedIndex];
    }
  }

  onBackdropClick(event: MouseEvent): void {
    // Close lightbox when clicking on backdrop (not the image)
    if (event.target === event.currentTarget) {
      this.closeLightbox();
    }
  }
}
