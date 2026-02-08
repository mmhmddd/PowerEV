import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';
import { SliderComponent } from "../../shared/slider/slider.component";
import { LatestProductsSliderComponent } from "../../shared/lates-products-slider/lates-products-slider.component";

// Interfaces
interface ProductCard {
  id: string;
  title: string;
  image: string;
  categoryId: string;
  ariaLabel: string;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, SliderComponent, LatestProductsSliderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [
    trigger('fadeInUp', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(40px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', animate('800ms ease-out'))
    ]),
    trigger('fadeIn', [
      state('void', style({
        opacity: 0
      })),
      state('*', style({
        opacity: 1
      })),
      transition('void => *', animate('1000ms ease-in'))
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  private isBrowser: boolean;
  isLoaded = false;

  // Hero Section Data
  heroContent = {
    title: {
      main: 'حلول شحن',
      highlight: 'السيارات الكهربائية'
    },
    subtitle: 'أفضل منتجات شحن السيارات الكهربائية في مصر. جودة عالية، ضمان شامل، وخدمة تركيب احترافية لراحتك.',
    buttons: [
      {
        text: 'احجز معاد تركيب',
        link: '/contact',
        type: 'primary',
        ariaLabel: 'احجز موعد تركيب شاحن السيارة الكهربائية'
      },
      {
        text: 'تصفح المنتجات',
        link: '/products',
        type: 'secondary',
        ariaLabel: 'تصفح منتجات شواحن السيارات الكهربائية'
      }
    ]
  };

  // Products Section Data
  productsSectionTitle = 'تصفح حسب الفئة';
  products: ProductCard[] = [
    {
      id: 'chargers',
      title: 'شواحن كهربائية',
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=600',
      categoryId: 'chargers',
      ariaLabel: 'تصفح شواحن كهربائية للسيارات'
    },
    {
      id: 'cables',
      title: 'كابلات الشحن',
      image: '/assets/images/home/cables.jpg',
      categoryId: 'cables',
      ariaLabel: 'تصفح كابلات الشحن'
    },
    {
      id: 'adapters',
      title: 'محولات وقوابس',
      image: '/assets/images/home/charger.jpg',
      categoryId: 'adapters',
      ariaLabel: 'تصفح محولات وقوابس الشحن'
    },
    {
      id: 'accessories',
      title: 'اكسسوارات وقطع غيار',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
      categoryId: 'accessories',
      ariaLabel: 'تصفح اكسسوارات وقطع الغيار'
    }
  ];

  // Why Choose Us Section Data
  whyChooseTitle = 'لماذا تختار';
  brandName = 'PowerEV';
  whyChooseSubtitle = 'نحن نقدم أكثر من مجرد منتجات، نحن نقدم حلولاً متكاملة لطاقة نظيفة ومستدام.';
  features: Feature[] = [
    {
      id: 'f1',
      icon: 'zap',
      title: 'جودة عالية',
      description: 'منتجات معتمدة عالمياً بأعلى معايير الجودة'
    },
    {
      id: 'f2',
      icon: 'shield',
      title: 'ضمان شامل',
      description: 'ضمان حقيقي على جميع المنتجات وخدمات التركيب'
    },
    {
      id: 'f3',
      icon: 'wrench',
      title: 'تركيب احترافي',
      description: 'فريق فني متخصص لتركيب آمن وسريع'
    },
    {
      id: 'f4',
      icon: 'circle-check',
      title: 'دعم فني',
      description: 'خدمة عملاء ودعم فني متواصل لخدمتكم'
    }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        this.isLoaded = true;
      }, 100);
    } else {
      this.isLoaded = true;
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Navigate to products page with category filter
   */
  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/products'], {
      queryParams: { category: categoryId }
    });
  }

  /**
   * Scroll to specific section
   */
  scrollToSection(sectionId: string): void {
    if (this.isBrowser) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  /**
   * Track by functions
   */
  trackByText(index: number, item: any): string {
    return item.text;
  }

  trackByProductId(index: number, product: ProductCard): string {
    return product.id;
  }

  trackByFeatureId(index: number, feature: Feature): string {
    return feature.id;
  }

  /**
   * Get SVG path based on icon name
   */
  getIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      'zap': 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
      'shield': 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
      'wrench': 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
      'circle-check': 'M21.801 10A10 10 0 1 1 17 3.335 M9 11l3 3L22 4'
    };
    return icons[iconName] || '';
  }
}
