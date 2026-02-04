import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';

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
  cartCount = 3; // Bind this to your cart service
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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Subscribe to route changes to close mobile menu on navigation
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
   * Toggle mobile menu open/closed
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    // Prevent body scroll when menu is open (browser only)
    if (this.isBrowser) {
      if (this.isMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  /**
   * Close mobile menu
   */
  closeMenu(): void {
    this.isMenuOpen = false;

    // Reset body overflow (browser only)
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  /**
   * Close menu when clicking outside on mobile (browser only)
   */
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
