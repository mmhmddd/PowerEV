// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor to add JWT token to all requests
 * Automatically attaches Authorization header with Bearer token
 * Handles 401 errors by logging out and redirecting to login
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // If we have a token, clone the request and add the Authorization header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request and catch any errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we get a 401 Unauthorized error, the token is invalid or expired
      if (error.status === 401) {
        console.warn('Auth Interceptor: 401 Unauthorized - logging out');

        // Clear auth state
        authService.logout();

        // Redirect to login page
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url }
        });
      }

      return throwError(() => error);
    })
  );
};
