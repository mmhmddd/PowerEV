import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FooterLink {
  name: string;
  path: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  private isBrowser: boolean;
  currentYear: number;

  // Quick Links
  quickLinks: FooterLink[] = [
    { name: 'جميع المنتجات', path: '/products' },
    { name: 'من نحن', path: '/about' },
    { name: 'معرض الصور', path: '/gallery' },
    { name: 'اتصل بنا', path: '/contact' }
  ];

  // Applications
  applications: FooterLink[] = [
    { name: 'شواحن كهربائية', path: '/products/chargers' },
    { name: 'كابلات الشحن', path: '/products/cables' },
    { name: 'محولات وقواعد', path: '/products/adapters' },
    { name: 'اكسسوارات', path: '/products/accessories' }
  ];

  // Social Media Links
  socialLinks: SocialLink[] = [
    {
      name: 'Facebook',
      url: 'https://facebook.com/powerev',
      icon: 'facebook'
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/powerev',
      icon: 'instagram'
    }
  ];

  // Contact Information
  contactInfo = {
    address: 'حلوان - برج التطعيش - شارع مصطفى صفوت\nتقاطع شارع عبد الرحمن',
    phone: '010 2021 6898',
    phoneRaw: '01020216898',
    email: 'info@powerev.com'
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.currentYear = new Date().getFullYear();
  }

  /**
   * Scroll to top of page
   */
  scrollToTop(): void {
    if (this.isBrowser) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByName(index: number, item: FooterLink | SocialLink): string {
    return item.name;
  }
}
