// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
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

  constructor(private http: HttpClient) {}

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
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
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
          localStorage.setItem('token', response.token);
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
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  /**
   * Check if user is authenticated
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Check if current user is admin
   * @returns boolean
   */
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  /**
   * Check if current user is employee
   * @returns boolean
   */
  isEmployee(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'employee';
  }

  /**
   * Get current user
   * @returns User object or null
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get authentication token
   * @returns Token string or null
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
