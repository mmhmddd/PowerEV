import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Product, ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  selectedCategory: string = 'all';
  mobileFiltersOpen: boolean = false;

  categories = [
    { id: 'all', name: 'الكل', nameEn: 'All' },
    { id: 'chargers', name: 'شواحن كهربائية', nameEn: 'Chargers' },
    { id: 'cables', name: 'كابلات الشحن', nameEn: 'Cables' },
    { id: 'adapters', name: 'محولات وقوابس', nameEn: 'Adapters' },
    { id: 'accessories', name: 'اكسسوارات', nameEn: 'Accessories' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check for category in route params
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['category']) {
          this.selectedCategory = params['category'];
          this.productService.filterByCategory(params['category']);
        } else {
          // Load all products if no category specified
          this.selectedCategory = 'all';
          this.productService.filterByCategory('all');
        }
      });

    // Subscribe to filtered products
    this.productService.getFilteredProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.products = products;
      });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.productService.filterByCategory(categoryId);

    // Close mobile filters after selection
    this.mobileFiltersOpen = false;

    // Navigate to the category route
    if (categoryId !== 'all') {
      this.router.navigate(['/products', categoryId]);
    } else {
      this.router.navigate(['/products']);
    }
  }

  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }

  viewProductDetails(product: Product): void {
    this.router.navigate(['/product-details', product.id]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
