import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'chargers' | 'cables' | 'adapters' | 'accessories';
  price: number;
  images: ProductImage[];
  description: string;
  specifications?: string[];
  inStock: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    {
      id: '1',
      name: 'شاحن منزلي ذكي 7kW',
      category: 'chargers',
      price: 4500,
      images: [
        { url: 'https://images.unsplash.com/photo-1662446759714-38641957247e?auto=format&fit=crop&q=80&w=800', alt: 'شاحن منزلي ذكي 7kW' },
        { url: 'https://images.unsplash.com/photo-1662446759714-38641957247e?auto=format&fit=crop&q=80&w=800', alt: 'شاحن منزلي ذكي 7kW - الجانب' }
      ],
      description: 'شاحن ذكي للمنزل بقوة 7 كيلوواط مع تحكم ذكي وأمان عالي',
      specifications: ['قوة: 7 كيلوواط', 'تحكم ذكي متقدم', 'حماية من الزيادة', 'قابل للتثبيت على الجدار'],
      inStock: true
    },
    {
      id: '2',
      name: 'كابل شحن Type 2',
      category: 'cables',
      price: 1200,
      images: [
        { url: 'https://images.unsplash.com/photo-1646719000106-963507639034?auto=format&fit=crop&q=80&w=800', alt: 'كابل شحن Type 2' }
      ],
      description: 'كابل شحن Type 2 عالي الجودة مع حماية متقدمة',
      specifications: ['نوع: Type 2', 'طول: 5 متر', 'معايير أوروبية', 'مقاومة للعوامل الجوية'],
      inStock: true
    },
    {
      id: '3',
      name: 'محول شحن محمول',
      category: 'adapters',
      price: 800,
      images: [
        { url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800', alt: 'محول شحن محمول' }
      ],
      description: 'محول شحن محمول متعدد الاستخدامات',
      specifications: ['وزن: 200 غرام', 'قابل للطي', 'آمن للسفر', 'متوافق مع معظم الأجهزة'],
      inStock: true
    },
    {
      id: '4',
      name: 'شاحن سريع 22kW',
      category: 'chargers',
      price: 12000,
      images: [
        { url: 'https://images.unsplash.com/photo-1646719000106-963507639034?auto=format&fit=crop&q=80&w=800', alt: 'شاحن سريع 22kW' }
      ],
      description: 'شاحن سريع احترافي بقوة 22 كيلوواط',
      specifications: ['قوة: 22 كيلوواط', 'شحن سريع جداً', 'تبريد ذكي', 'واجهة تحكم رقمية'],
      inStock: true
    },
    {
      id: '5',
      name: 'قاطع كهربائي 32A',
      category: 'accessories',
      price: 350,
      images: [
        { url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800', alt: 'قاطع كهربائي 32A' }
      ],
      description: 'قاطع كهربائي آمن 32 أمبير',
      specifications: ['قوة: 32 أمبير', 'معايير عالية', 'حماية من الحمل الزائد', 'معتمد دولياً'],
      inStock: true
    },
    {
      id: '6',
      name: 'حامل كابل جداري',
      category: 'accessories',
      price: 250,
      images: [
        { url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800', alt: 'حامل كابل جداري' }
      ],
      description: 'حامل كابل جداري منظم وعملي',
      specifications: ['مادة: بلاستيك متين', 'سهل التركيب', 'يحمل عدة كابلات', 'تصميم عصري'],
      inStock: true
    },
    {
      id: '7',
      name: 'شاحن محمول 3.5kW',
      category: 'chargers',
      price: 3200,
      images: [
        { url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800', alt: 'شاحن محمول 3.5kW' }
      ],
      description: 'شاحن محمول عملي بقوة 3.5 كيلوواط',
      specifications: ['قوة: 3.5 كيلوواط', 'محمول وخفيف', 'بطارية مدمجة', 'شاشة عرض رقمية'],
      inStock: true
    },
    {
      id: '8',
      name: 'كابل تمديد 10 متر',
      category: 'cables',
      price: 2100,
      images: [
        { url: 'https://images.unsplash.com/photo-1646719000106-963507639034?auto=format&fit=crop&q=80&w=800', alt: 'كابل تمديد 10 متر' }
      ],
      description: 'كابل تمديد قوي 10 متر',
      specifications: ['طول: 10 متر', 'قوة: 32 أمبير', 'مرن وآمن', 'مقاومة للماء'],
      inStock: true
    }
  ];

  private filteredProductsSubject = new BehaviorSubject<Product[]>(this.products);
  public filteredProducts$ = this.filteredProductsSubject.asObservable();

  private selectedCategorySubject = new BehaviorSubject<string>('all');
  public selectedCategory$ = this.selectedCategorySubject.asObservable();

  constructor() {}

  getAllProducts(): Product[] {
    return this.products;
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  filterByCategory(category: string): void {
    this.selectedCategorySubject.next(category);

    if (category === 'all') {
      this.filteredProductsSubject.next(this.products);
    } else {
      const filtered = this.products.filter(p => p.category === category);
      this.filteredProductsSubject.next(filtered);
    }
  }

  getFilteredProducts(): Observable<Product[]> {
    return this.filteredProducts$;
  }

  getCurrentCategory(): string {
    return this.selectedCategorySubject.value;
  }
}
