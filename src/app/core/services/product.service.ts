// src/app/core/services/product.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AdapterService } from './adapter.service';
import { BoxService } from './box.service';
import { BreakerService } from './breaker.service';
import { CableService } from './cable.service';
import { ChargerService } from './charger.service';
import { OtherService } from './other.service';
import { PlugService } from './plug.service';
import { StationService } from './station.service';
import { WireService } from './wire.service';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryType: ProductCategoryType;
  inStock: boolean;
  stock?: number;
  images: Array<{ url: string; alt: string }>;
  specifications?: string[];
  brand?: string;
  offer?: {
    enabled: boolean;
    discountPercentage: number;
  };
  finalPrice?: number;
}

export enum ProductCategoryType {
  ADAPTER = 'adapter',
  BOX = 'box',
  BREAKER = 'breaker',
  CABLE = 'cable',
  CHARGER = 'charger',
  OTHER = 'other',
  PLUG = 'plug',
  STATION = 'station',
  WIRE = 'wire'
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private allProducts$ = new BehaviorSubject<Product[]>([]);
  private filteredProducts$ = new BehaviorSubject<Product[]>([]);
  private isLoading$ = new BehaviorSubject<boolean>(false);

  constructor(
    private adapterService: AdapterService,
    private boxService: BoxService,
    private breakerService: BreakerService,
    private cableService: CableService,
    private chargerService: ChargerService,
    private otherService: OtherService,
    private plugService: PlugService,
    private stationService: StationService,
    private wireService: WireService
  ) {
    this.loadAllProducts();
  }

  /**
   * Load all products from all services
   */
  private loadAllProducts(): void {
    this.isLoading$.next(true);

    forkJoin({
      adapters: this.adapterService.getAllAdapters().pipe(
        catchError(err => {
          console.error('Error loading adapters:', err);
          return of({ success: false, count: 0, adapters: [] });
        })
      ),
      boxes: this.boxService.getAllBoxes().pipe(
        catchError(err => {
          console.error('Error loading boxes:', err);
          return of({ success: false, count: 0, boxes: [] });
        })
      ),
      breakers: this.breakerService.getAllBreakers().pipe(
        catchError(err => {
          console.error('Error loading breakers:', err);
          return of({ success: false, count: 0, breakers: [] });
        })
      ),
      cables: this.cableService.getAllCables().pipe(
        catchError(err => {
          console.error('Error loading cables:', err);
          return of({ success: false, count: 0, cables: [] });
        })
      ),
      chargers: this.chargerService.getAllChargers().pipe(
        catchError(err => {
          console.error('Error loading chargers:', err);
          return of({ success: false, count: 0, chargers: [] });
        })
      ),
      others: this.otherService.getAllOthers().pipe(
        catchError(err => {
          console.error('Error loading others:', err);
          return of({ success: false, count: 0, others: [] });
        })
      ),
      plugs: this.plugService.getAllPlugs().pipe(
        catchError(err => {
          console.error('Error loading plugs:', err);
          return of({ success: false, count: 0, plugs: [] });
        })
      ),
      stations: this.stationService.getAllStations().pipe(
        catchError(err => {
          console.error('Error loading stations:', err);
          return of({ success: false, count: 0, stations: [] });
        })
      ),
      wires: this.wireService.getAllWires().pipe(
        catchError(err => {
          console.error('Error loading wires:', err);
          return of({ success: false, count: 0, wires: [] });
        })
      )
    }).subscribe({
      next: (responses) => {
        const products: Product[] = [
          ...this.mapToProducts(responses.adapters.adapters || [], ProductCategoryType.ADAPTER, 'محولات'),
          ...this.mapToProducts(responses.boxes.boxes || [], ProductCategoryType.BOX, 'صناديق توزيع'),
          ...this.mapToProducts(responses.breakers.breakers || [], ProductCategoryType.BREAKER, 'قواطع كهربائية'),
          ...this.mapToProducts(responses.cables.cables || [], ProductCategoryType.CABLE, 'كابلات'),
          ...this.mapToProducts(responses.chargers.chargers || [], ProductCategoryType.CHARGER, 'شواحن'),
          ...this.mapToProducts(responses.others.others || [], ProductCategoryType.OTHER, 'منتجات أخرى'),
          ...this.mapToProducts(responses.plugs.plugs || [], ProductCategoryType.PLUG, 'قوابس'),
          ...this.mapToProducts(responses.stations.stations || [], ProductCategoryType.STATION, 'محطات شحن'),
          ...this.mapToProducts(responses.wires.wires || [], ProductCategoryType.WIRE, 'أسلاك')
        ];

        console.log('Loaded products:', products.length);
        this.allProducts$.next(products);
        this.filteredProducts$.next(products);
        this.isLoading$.next(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Map API response to Product interface
   */
  private mapToProducts(items: any[], categoryType: ProductCategoryType, categoryName: string): Product[] {
    if (!items || !Array.isArray(items)) return [];

    return items.map(item => ({
      id: item._id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: categoryName,
      categoryType: categoryType,
      inStock: item.stock > 0,
      stock: item.stock,
      images: this.mapImages(item.images),
      specifications: this.extractSpecifications(item),
      brand: item.brand,
      offer: item.offer,
      finalPrice: this.calculateFinalPrice(item)
    }));
  }

  /**
   * Map image objects to standard format
   */
  private mapImages(images: any[]): Array<{ url: string; alt: string }> {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return [{
        url: 'assets/images/placeholder.jpg',
        alt: 'Product Image'
      }];
    }

    return images.map(img => ({
      url: img.url || img,
      alt: img.alt || 'Product Image'
    }));
  }

  /**
   * Extract specifications from product based on type
   */
  private extractSpecifications(item: any): string[] {
    const specs: string[] = [];

    if (item.voltage) specs.push(`الجهد: ${item.voltage}V`);
    if (item.current) specs.push(`التيار: ${item.current}A`);
    if (item.ampere) specs.push(`الأمبير: ${item.ampere}A`);
    if (item.amperage) specs.push(`الأمبير: ${item.amperage}A`);
    if (item.phase) specs.push(`الطور: ${item.phase}`);
    if (item.wireGauge) specs.push(`مقاس السلك: ${item.wireGauge}`);
    if (item.cableLength) specs.push(`طول الكابل: ${item.cableLength}m`);
    if (item.length) specs.push(`الطول: ${item.length}m`);
    if (item.efficiency) specs.push(`الكفاءة: ${item.efficiency}%`);
    if (item.type) specs.push(`النوع: ${item.type}`);
    if (item.connectorType) specs.push(`نوع الموصل: ${item.connectorType}`);
    if (item.connectorFrom) specs.push(`موصل من: ${item.connectorFrom}`);
    if (item.connectorTo) specs.push(`موصل إلى: ${item.connectorTo}`);
    if (item.size) specs.push(`الحجم: ${item.size}`);
    if (item.material) specs.push(`المادة: ${item.material}`);
    if (item.power) specs.push(`القدرة: ${item.power}W`);
    if (item.brand) specs.push(`العلامة التجارية: ${item.brand}`);
    if (item.quantity) specs.push(`الكمية: ${item.quantity}`);

    return specs;
  }

  /**
   * Calculate final price with discount
   */
  private calculateFinalPrice(item: any): number {
    if (item.offer?.enabled && item.offer.discountPercentage > 0) {
      return item.price - (item.price * item.offer.discountPercentage) / 100;
    }
    return item.price;
  }

  /**
   * Filter products by category
   */
  filterByCategory(category: string): void {
    const allProducts = this.allProducts$.value;

    if (category === 'all') {
      this.filteredProducts$.next(allProducts);
      return;
    }

    // Map frontend categories to backend types
    const categoryMap: { [key: string]: ProductCategoryType[] } = {
      'chargers': [ProductCategoryType.CHARGER, ProductCategoryType.STATION],
      'cables': [ProductCategoryType.CABLE, ProductCategoryType.WIRE],
      'adapters': [ProductCategoryType.ADAPTER, ProductCategoryType.PLUG],
      'boxes': [ProductCategoryType.BOX],
      'breakers': [ProductCategoryType.BREAKER],
      'accessories': [ProductCategoryType.OTHER]
    };

    const categoryTypes = categoryMap[category] || [];
    const filtered = allProducts.filter(product =>
      categoryTypes.includes(product.categoryType)
    );

    this.filteredProducts$.next(filtered);
  }

  /**
   * Search products by name or description
   */
  searchProducts(query: string): void {
    const allProducts = this.allProducts$.value;
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
      this.filteredProducts$.next(allProducts);
      return;
    }

    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );

    this.filteredProducts$.next(filtered);
  }

  /**
   * Filter by price range
   */
  filterByPriceRange(minPrice: number, maxPrice: number): void {
    const allProducts = this.allProducts$.value;
    const filtered = allProducts.filter(product => {
      const price = product.finalPrice || product.price;
      return price >= minPrice && price <= maxPrice;
    });

    this.filteredProducts$.next(filtered);
  }

  /**
   * Filter by stock availability
   */
  filterByStock(inStockOnly: boolean): void {
    const allProducts = this.allProducts$.value;
    const filtered = inStockOnly
      ? allProducts.filter(product => product.inStock)
      : allProducts;

    this.filteredProducts$.next(filtered);
  }

  /**
   * Sort products
   */
  sortProducts(sortBy: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'): void {
    const products = [...this.filteredProducts$.value];

    products.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.finalPrice || a.price) - (b.finalPrice || b.price);
        case 'price-desc':
          return (b.finalPrice || b.price) - (a.finalPrice || a.price);
        case 'name-asc':
          return a.name.localeCompare(b.name, 'ar');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'ar');
        default:
          return 0;
      }
    });

    this.filteredProducts$.next(products);
  }

  /**
   * Get product by ID
   */
  getProductById(id: string): Product | undefined {
    return this.allProducts$.value.find(product => product.id === id);
  }

  /**
   * Get filtered products observable
   */
  getFilteredProducts(): Observable<Product[]> {
    return this.filteredProducts$.asObservable();
  }

  /**
   * Get all products observable
   */
  getAllProducts(): Observable<Product[]> {
    return this.allProducts$.asObservable();
  }

  /**
   * Get loading state
   */
  getLoadingState(): Observable<boolean> {
    return this.isLoading$.asObservable();
  }

  /**
   * Refresh all products
   */
  refreshProducts(): void {
    this.loadAllProducts();
  }
}
