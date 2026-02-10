import { Routes } from '@angular/router';
import { authGuard, noAuthGuard, adminGuard } from './core/guards/auth.guard';

// Public / marketing pages (most users land here first)
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // ── Home ────────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component')
      .then(c => c.HomeComponent),
    title: 'Home'
  },

  // ── Static pages ────────────────────────────────────────
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component')
      .then(c => c.AboutComponent),
    title: 'About Us'
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component')
      .then(c => c.ContactComponent),
    title: 'Contact'
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery.component')
      .then(c => c.GalleryComponent),
    title: 'Gallery'
  },

  // ── E-commerce flow ─────────────────────────────────────
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.component')
      .then(c => c.ProductsComponent),
    title: 'Products'
  },
  {
    path: 'product-details/:id',
    loadComponent: () => import('./pages/product-details/product-details.component')
      .then(c => c.ProductDetailsComponent),
    title: 'Product Details'
  },

  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component')
      .then(c => c.CartComponent),
    title: 'Shopping Cart'
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component')
      .then(c => c.CheckoutComponent),
    // Uncomment to require authentication for checkout:
    // canActivate: [authGuard],
    title: 'Checkout'
  },

  // ── Auth ────────────────────────────────────────────────
  // noAuthGuard prevents logged-in users from accessing these pages
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component')
      .then(c => c.LoginComponent),
    title: 'Sign In'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.component')
      .then(c => c.ResetPasswordComponent),
    title: 'Reset Password'
  },

  // ── Admin area ──────────────────────────────────────────
  // Protected by adminGuard - requires admin/employee role
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard.component')
          .then(c => c.DashboardComponent),
        title: 'Admin Dashboard'
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/user-control/user-control.component')
          .then(c => c.UserControlComponent),
        title: 'User Management'
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin/order-control/order-control.component')
          .then(c => c.OrderControlComponent),
        title: 'Order Management'
      },
      {
        path: 'adapters',
        loadComponent: () => import('./admin/adapter-control/adapter-control.component')
          .then(c => c.AdapterControlComponent),
        title: 'Adapter Management'
      },
      {
        path: 'boxes',
        loadComponent: () => import('./admin/box-control/box-control.component')
          .then(c => c.BoxControlComponent),
        title: 'Box Management'
      },
      {
        path: 'breakers',
        loadComponent: () => import('./admin/breaker-control/breaker-control.component')
          .then(c => c.BreakerControlComponent),
        title: 'Breaker Management'
      },
      {
        path: 'cables',
        loadComponent: () => import('./admin/cable-control/cable-control.component')
          .then(c => c.CableControlComponent),
        title: 'Cable Management'
      },
      {
        path: 'chargers',
        loadComponent: () => import('./admin/charger-control/charger-control.component')
          .then(c => c.ChargerControlComponent),
        title: 'Charger Management'
      },
      {
        path: 'others',
        loadComponent: () => import('./admin/other-control/other-control.component')
          .then(c => c.OtherControlComponent),
        title: 'Other Management'
      },
      {
        path: 'plugs',
        loadComponent: () => import('./admin/plug-control/plug-control.component')
          .then(c => c.PlugControlComponent),
        title: 'Plug Management'
      },
      {
        path: 'wires',
        loadComponent: () => import('./admin/wires-control/wires-control.component')
          .then(c => c.WiresControlComponent),
        title: 'Wires Management'
      },
      {
        path: 'gallery',
        loadComponent: () => import('./admin/gallery-control/gallery-control.component')
          .then(c => c.GalleryControlComponent),
        title: 'Gallery Management'
      },
      {
        path: 'stations',
        loadComponent: () => import('./admin/station-control/station-control.component')
          .then(c => c.StationControlComponent),
        title: 'Station Management'
      }
    ]
  },

  // ── 404 ─────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'home'
    // or → loadComponent: () => import('./pages/not-found/not-found.component')...
  }
];
