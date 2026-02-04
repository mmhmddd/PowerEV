import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';

interface ProductCard {
  id: string;
  title: string;
  image: string;
  link: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-products-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products-section.component.html',
  styleUrl: './products-section.component.scss',
  animations: [
    trigger('fadeInUp', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(30px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', animate('600ms ease-out'))
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
export class ProductsSectionComponent {

  // Section title
  sectionTitle = 'تصفح حسب الفئة';

  // Product categories
  products: ProductCard[] = [
    {
      id: 'chargers',
      title: 'شواحن كهربائية',
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=600',
      link: '/products?category=chargers',
      ariaLabel: 'تصفح شواحن كهربائية للسيارات'
    },
    {
      id: 'cables',
      title: 'كابلات الشحن',
      image: 'https://images.unsplash.com/photo-1646719000106-963507639034?auto=format&fit=crop&q=80&w=600',
      link: '/products?category=cables',
      ariaLabel: 'تصفح كابلات الشحن'
    },
    {
      id: 'adapters',
      title: 'محولات وقوابس',
      image: 'https://images.unsplash.com/photo-1662446759714-38641957247e?auto=format&fit=crop&q=80&w=600',
      link: '/products?category=adapters',
      ariaLabel: 'تصفح محولات وقوابس الشحن'
    },
    {
      id: 'accessories',
      title: 'اكسسوارات وقطع غيار',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
      link: '/products?category=accessories',
      ariaLabel: 'تصفح اكسسوارات وقطع الغيار'
    }
  ];

  /**
   * Track by function for products
   */
  trackByProductId(index: number, product: ProductCard): string {
    return product.id;
  }
}
