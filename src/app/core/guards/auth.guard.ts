// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  console.warn('AuthGuard: User not authenticated, redirecting to login');
  // Redirect to login page
  return router.createUrlTree(['/login']);
};

/**
 * Guard to prevent authenticated users from accessing auth pages (login, register)
 * Redirects to dashboard if user is already logged in
 */
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // User is already logged in, redirect to appropriate dashboard
  const user = authService.getCurrentUser();

  if (user?.role === 'admin' || user?.role === 'employee') {
    console.log('NoAuthGuard: User is admin/employee, redirecting to admin dashboard');
    return router.createUrlTree(['/admin/dashboard']);
  }

  console.log('NoAuthGuard: User is authenticated, redirecting to home');
  return router.createUrlTree(['/home']);
};

/**
 * Guard to protect admin routes
 * Requires user to be authenticated AND have admin/employee role
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check authentication first
  if (!authService.isAuthenticated()) {
    console.warn('AdminGuard: User not authenticated, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  // Get current user
  const user = authService.getCurrentUser();

  // Debug logging
  console.log('AdminGuard: User data:', user);
  console.log('AdminGuard: User role:', user?.role);

  // Check if user has admin or employee role
  if (user?.role === 'admin' || user?.role === 'employee') {
    console.log('AdminGuard: Access granted');
    return true;
  }

  // User is authenticated but not admin/employee
  console.warn('AdminGuard: User does not have required role, redirecting to home');
  console.warn('AdminGuard: Current user role:', user?.role);
  return router.createUrlTree(['/home']);
};
