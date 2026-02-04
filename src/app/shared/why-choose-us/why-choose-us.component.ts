import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Feature interface
export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-why-choose-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './why-choose-us.component.html',
  styleUrl: './why-choose-us.component.scss'
})
export class WhyChooseUsComponent {
  // Section title
  sectionTitle = 'لماذا تختار';
  brandName = 'PowerEV';
  sectionSubtitle = 'نحن نقدم أكثر من مجرد منتجات، نحن نقدم حلولاً متكاملة لطاقة نظيفة ومستقبل مستدام.';

  // Features data
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

  /**
   * Track by function for ngFor optimization
   */
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
