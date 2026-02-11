import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { CartService } from '../../core/services/cart.service';

interface NavLink {
  name: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  cartCount = 0; // Will be updated from CartService
  isDark = true;

  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  navLinks: NavLink[] = [
    { name: 'الرئيسية', path: '/' },
    { name: 'المنتجات', path: '/products' },
    { name: 'من نحن', path: '/about' },
    { name: 'معرض الصور', path: '/gallery' },
    { name: 'اتصل بنا', path: '/contact' }
  ];

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme: Theme) => {
        this.isDark = theme === 'dark';
      });

    // Subscribe to cart changes and update cart count dynamically
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        if (cart) {
          // Calculate total quantity of all items in cart
          this.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
          console.log('Cart count updated:', this.cartCount);
        } else {
          this.cartCount = 0;
        }
      });

    // Close mobile menu on navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.closeMenu();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle theme between dark and light
   */
  toggleTheme(): void {
    this.themeService.toggle();
  }

  /**
   * Toggle mobile menu open/closed
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    if (this.isBrowser) {
      document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    }
  }

  /**
   * Close mobile menu
   */
  closeMenu(): void {
    this.isMenuOpen = false;

    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isBrowser) return;

    const target = event.target as HTMLElement;
    const navbar = target.closest('.navbar-header');

    if (!navbar && this.isMenuOpen) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (!this.isBrowser) return;

    if (this.isMenuOpen) {
      this.closeMenu();
    }
  }
}
