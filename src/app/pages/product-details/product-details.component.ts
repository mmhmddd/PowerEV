import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Product, ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  selectedImageIndex: number = 0;
  quantity: number = 1;
  showAddedToCart: boolean = false;
  isLoading: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.product = this.productService.getProductById(params['id']) ?? null;
          this.isLoading = false;

          if (!this.product) {
            // Redirect to products if product not found
            this.router.navigate(['/products']);
          }
        }
      });
  }

  selectImage(index: number): void {
    if (this.product) {
      this.selectedImageIndex = Math.max(0, Math.min(index, this.product.images.length - 1));
    }
  }

  nextImage(): void {
    if (this.product) {
      this.selectedImageIndex = (this.selectedImageIndex + 1) % this.product.images.length;
    }
  }

  prevImage(): void {
    if (this.product) {
      this.selectedImageIndex = (this.selectedImageIndex - 1 + this.product.images.length) % this.product.images.length;
    }
  }

  incrementQuantity(): void {
    this.quantity++;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    this.showAddedToCart = true;

    // Reset after 2 seconds
    setTimeout(() => {
      this.showAddedToCart = false;
    }, 2000);
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  sharePage(): void {
    if (this.product && navigator.share) {
      navigator.share({
        title: this.product.name,
        text: this.product.description,
        url: window.location.href
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
