// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import { User, UsersResponse, UserResponse, ApiResponse } from '../models/product.models';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'employee';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'employee';
}

export interface UpdatePasswordRequest {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  /**
   * Get all users (Admin only)
   * Returns users without password field
   * @returns Observable of users response
   */
  getAllUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(ApiEndpoints.users.getAll);
  }

  /**
   * Get single user by ID (Admin only)
   * Returns user without password field
   * @param id - User ID
   * @returns Observable of user response
   */
  getUser(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(ApiEndpoints.users.getById(id));
  }

  /**
   * Create new user (Admin only)
   * Required: name, email, password
   * Optional: role (defaults to 'employee')
   * Email must be unique
   * Password must be at least 6 characters
   * @param user - User data
   * @returns Observable of user response
   */
  createUser(user: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(ApiEndpoints.users.create, user);
  }

  /**
   * Update user (Admin only)
   * Can update: name, email, role
   * Cannot update password (use updateUserPassword instead)
   * @param id - User ID
   * @param user - Updated user data
   * @returns Observable of user response
   */
  updateUser(id: string, user: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(ApiEndpoints.users.update(id), user);
  }

  /**
   * Delete user (Admin only)
   * Admin cannot delete their own account
   * @param id - User ID
   * @returns Observable of response
   */
  deleteUser(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.users.delete(id));
  }

  /**
   * Update user password (Admin only)
   * Password must be at least 6 characters
   * Password is hashed before saving
   * @param id - User ID
   * @param password - New password
   * @returns Observable of response
   */
  updateUserPassword(id: string, password: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      ApiEndpoints.users.updatePassword(id),
      { password }
    );
  }
}
