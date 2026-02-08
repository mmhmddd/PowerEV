import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  isOpen = signal(true);
  isMobile = signal(false);

  menuItems = [
    { label: 'لوحة التحكم', icon: 'grid', route: '/admin/dashboard', active: true },
    { label: 'المنتجات', icon: 'package', route: '/products', active: false },
    { label: 'المستخدمون', icon: 'users', route: '/admin/users', active: false },
    { label: 'الطلبات', icon: 'shopping-cart', route: '/checkout', active: false },
    { label: 'معرض الصور', icon: 'image', route: '/gallery', active: false },
    { label: 'الإعدادات', icon: 'settings', route: '/admin', active: false }
  ];

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const width = window.innerWidth;
    const wasMobile = this.isMobile();
    this.isMobile.set(width <= 1024);

    // Auto-close sidebar on mobile, auto-open on desktop
    if (this.isMobile() && !wasMobile) {
      // Switched to mobile view - close sidebar
      this.isOpen.set(false);
    } else if (!this.isMobile() && wasMobile) {
      // Switched to desktop view - open sidebar
      this.isOpen.set(true);
    }
  }

  toggleSidebar() {
    this.isOpen.update(value => !value);
  }

  // Close sidebar when clicking on a menu item (mobile only)
  onMenuItemClick() {
    if (this.isMobile()) {
      this.isOpen.set(false);
    }
  }
}
