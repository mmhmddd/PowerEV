import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
    { label: 'لوحة التحكم',       icon: 'grid',            route: '/admin/dashboard', active: false },
    { label: 'الطلبات',           icon: 'shopping-cart',   route: '/admin/orders',    active: false },
    { label: 'المستخدمون',        icon: 'users',           route: '/admin/users',     active: false },
    { label: 'شواحن',             icon: 'battery',         route: '/admin/chargers',  active: false },
    { label: 'محطات شحن',         icon: 'charging-station',route: '/admin/stations',  active: false },
    { label: 'كابلات',            icon: 'cable',           route: '/admin/cables',    active: false },
    { label: 'أسلاك',             icon: 'cable',           route: '/admin/wires',     active: false },
    { label: 'محولات',            icon: 'plug',            route: '/admin/adapters',  active: false },
    { label: 'قوابس',             icon: 'plug',            route: '/admin/plugs',     active: false },
    { label: 'صناديق توزيع',      icon: 'box',             route: '/admin/boxes',     active: false },
    { label: 'قواطع كهربائية',    icon: 'switch',          route: '/admin/breakers',  active: false },
    { label: 'منتجات أخرى',       icon: 'tool',            route: '/admin/others',    active: false },
    { label: 'معرض الصور',        icon: 'image',           route: '/admin/gallery',   active: false },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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

    if (this.isMobile() && !wasMobile) {
      this.isOpen.set(false);
    } else if (!this.isMobile() && wasMobile) {
      this.isOpen.set(true);
    }
  }

  toggleSidebar() {
    this.isOpen.update(value => !value);
  }

  onMenuItemClick() {
    if (this.isMobile()) {
      this.isOpen.set(false);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
