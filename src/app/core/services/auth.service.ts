// src/app/core/services/auth.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import { User, AuthResponse, UserResponse } from '../models/product.models';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getUserFromStorage(): User | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error reading user from storage:', error);
      return null;
    }
  }

  private setLocalStorage(key: string, value: string): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting localStorage:', error);
      }
    }
  }

  private getLocalStorage(key: string): string | null {
    if (this.isBrowser) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error getting localStorage:', error);
        return null;
      }
    }
    return null;
  }

  private removeLocalStorage(key: string): void {
    if (this.isBrowser) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing localStorage:', error);
      }
    }
  }

  /**
   * Login user
   * Required: email, password
   * Returns: token and user object
   * @param credentials - Login credentials
   * @returns Observable of auth response
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(ApiEndpoints.auth.login, credentials).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setLocalStorage('token', response.token);
          this.setLocalStorage('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  /**
   * Logout user
   * Clears token and user from localStorage
   */
  logout(): void {
    this.removeLocalStorage('token');
    this.removeLocalStorage('user');
    this.currentUserSubject.next(null);
  }

  /**
   * Forgot password - sends reset email
   * Backend generates reset token and sends email
   * @param email - User email
   * @returns Observable of response
   */
  forgotPassword(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(ApiEndpoints.auth.forgotPassword, { email });
  }

  /**
   * Reset password with token
   * Token is from the email link
   * @param resetToken - Token from email
   * @param password - New password (min 6 characters)
   * @returns Observable of auth response with new token
   */
  resetPassword(resetToken: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      ApiEndpoints.auth.resetPassword(resetToken),
      { password }
    ).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.setLocalStorage('token', response.token);
        }
      })
    );
  }

  /**
   * Get current logged in user info
   * Requires authentication (token)
   * @returns Observable of user response
   */
  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(ApiEndpoints.auth.getMe).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.setLocalStorage('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  /**
   * Check if user is authenticated
   * Also syncs user state from localStorage if needed
   * @returns boolean
   */
  isAuthenticated(): boolean {
    const hasToken = !!this.getLocalStorage('token');

    // Sync user state if we have a token but no user in memory
    if (hasToken && !this.currentUserSubject.value) {
      const user = this.getUserFromStorage();
      if (user) {
        this.currentUserSubject.next(user);
      }
    }

    return hasToken;
  }

  /**
   * Check if current user is admin
   * @returns boolean
   */
  isAdmin(): boolean {
    // Ensure user state is synced
    this.isAuthenticated();
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  /**
   * Check if current user is employee
   * @returns boolean
   */
  isEmployee(): boolean {
    // Ensure user state is synced
    this.isAuthenticated();
    const user = this.currentUserSubject.value;
    return user?.role === 'employee';
  }

  /**
   * Get current user
   * Ensures user state is synced from localStorage
   * @returns User object or null
   */
  getCurrentUser(): User | null {
    // Ensure user state is synced
    this.isAuthenticated();
    return this.currentUserSubject.value;
  }

  /**
   * Get authentication token
   * @returns Token string or null
   */
  getToken(): string | null {
    return this.getLocalStorage('token');
  }
}
