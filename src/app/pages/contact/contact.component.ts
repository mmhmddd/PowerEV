import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';

interface ContactInfo {
  icon: string;
  title: string;
  content: string;
  dir?: 'ltr' | 'rtl';
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  isBrowser: boolean;

  contactDetails: ContactInfo[] = [
    {
      icon: 'map-pin',
      title: 'العنوان',
      content: 'حلوان - برج التطبيقيين\nشارع مصطفى صفوت تقاطع شارع عبد الرحمن'
    },
    {
      icon: 'phone',
      title: 'الهاتف',
      content: '010 2021 6898',
      dir: 'ltr'
    },
    {
      icon: 'mail',
      title: 'البريد الإلكتروني',
      content: 'info@powerev.com'
    },
    {
      icon: 'clock',
      title: 'ساعات العمل',
      content: 'السبت - الخميس: 9:00 ص - 6:00 م'
    }
  ];

  inquiryTypes = [
    'استفسار عام',
    'طلب تركيب',
    'صيانة',
    'شكوى'
  ];

  constructor(
    private fb: FormBuilder,
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      inquiryType: ['استفسار عام', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // SEO Meta tags
    this.title.setTitle('تواصل معنا - Power EV | خدمات شحن السيارات الكهربائية');
    this.meta.addTags([
      { name: 'description', content: 'تواصل مع Power EV للحصول على أفضل حلول شحن السيارات الكهربائية. نحن هنا لخدمتك في حلوان، القاهرة.' },
      { name: 'keywords', content: 'تواصل معنا, Power EV, شحن سيارات كهربائية, حلوان, القاهرة, خدمة العملاء' },
      { property: 'og:title', content: 'تواصل معنا - Power EV' },
      { property: 'og:description', content: 'تواصل معنا للحصول على أفضل خدمات شحن السيارات الكهربائية' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' }
    ]);

    // Add structured data for local business
    if (this.isBrowser) {
      this.addStructuredData();
    }
  }

  private addStructuredData(): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Power EV',
      description: 'خدمات شحن السيارات الكهربائية',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'برج التطبيقيين، شارع مصطفى صفوت تقاطع شارع عبد الرحمن',
        addressLocality: 'حلوان',
        addressRegion: 'القاهرة',
        addressCountry: 'EG'
      },
      telephone: '+20-10-2021-6898',
      email: 'info@powerev.com',
      openingHours: 'Sa-Th 09:00-18:00',
      url: window.location.href
    });
    document.head.appendChild(script);
  }

  onSubmit(): void {
    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      // Log form data to console
      console.log('Form Data:', this.contactForm.value);

      // Show success message
      setTimeout(() => {
        alert('تم إرسال رسالتك بنجاح!');
        this.contactForm.reset({ inquiryType: 'استفسار عام' });
        this.isSubmitting = false;
      }, 1500);
    } else {
      this.markFormGroupTouched(this.contactForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
