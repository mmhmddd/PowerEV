import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatItem {
  value: string;
  label: string;
  delay: number;
}

interface ValueCard {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit {
  stats: StatItem[] = [
    { value: '+500', label: 'عميل راضٍ', delay: 0 },
    { value: '+1000', label: 'محطة شحن', delay: 100 },
    { value: '24/7', label: 'دعم فني', delay: 200 }
  ];

  values: ValueCard[] = [
    {
      icon: 'target',
      title: 'رؤيتنا',
      description: 'أن نكون الخيار الأول لحلول شحن السيارات الكهربائية في الشرق الأوسط.',
      delay: 0
    },
    {
      icon: 'zap',
      title: 'مهمتنا',
      description: 'توفير منتجات شحن عالية الجودة وموثوقة بأسعار تنافسية مع خدمة استثنائية.',
      delay: 100
    },
    {
      icon: 'heart',
      title: 'قيمنا',
      description: 'الابتكار، الجودة، الاستدامة، ورضا العملاء هم جوهر كل ما نقوم به.',
      delay: 200
    }
  ];

  ngOnInit(): void {
    // Animation triggers on load
  }

  scrollToProducts(): void {
    // Implement scroll to products section
    const productsSection = document.querySelector('.products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      'target': 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-14a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z',
      'zap': 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
      'heart': 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'
    };
    return icons[iconName] || '';
  }
}
