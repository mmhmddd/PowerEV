// src/app/core/services/breaker.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import {
  Breaker,
  BreakersResponse,
  BreakerResponse,
  ApiResponse
} from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class BreakerService {
  constructor(private http: HttpClient) {}

  /**
   * Get all breakers
   * @returns Observable of breakers response
   */
  getAllBreakers(): Observable<BreakersResponse> {
    return this.http.get<BreakersResponse>(ApiEndpoints.breakers.getAll);
  }

  /**
   * Get single breaker by ID
   * @param id - Breaker ID
   * @returns Observable of breaker response
   */
  getBreaker(id: string): Observable<BreakerResponse> {
    return this.http.get<BreakerResponse>(ApiEndpoints.breakers.getById(id));
  }

  /**
   * Create new breaker (Admin only)
   * Required fields: name, price, stock
   * Optional fields: brand, description, images, quantity, offer, ampere, voltage, type
   * @param breaker - Breaker data
   * @returns Observable of created breaker response
   */
  createBreaker(breaker: Partial<Breaker>): Observable<BreakerResponse> {
    return this.http.post<BreakerResponse>(ApiEndpoints.breakers.create, breaker);
  }

  /**
   * Update breaker (Admin only)
   * All fields are optional
   * @param id - Breaker ID
   * @param breaker - Updated breaker data
   * @returns Observable of updated breaker response
   */
  updateBreaker(id: string, breaker: Partial<Breaker>): Observable<BreakerResponse> {
    return this.http.put<BreakerResponse>(ApiEndpoints.breakers.update(id), breaker);
  }

  /**
   * Delete breaker (Admin only)
   * Also deletes associated images from Cloudinary
   * @param id - Breaker ID
   * @returns Observable of delete response
   */
  deleteBreaker(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.breakers.delete(id));
  }

  /**
   * Upload breaker with images (base64)
   * Images will be automatically uploaded to Cloudinary
   * @param breaker - Breaker data with base64 images
   * @returns Observable of created breaker response
   */
  createBreakerWithImages(breaker: Partial<Breaker> & { images: string[] }): Observable<BreakerResponse> {
    return this.http.post<BreakerResponse>(ApiEndpoints.breakers.create, breaker);
  }

  /**
   * Update breaker with new images (base64)
   * Old images will be deleted from Cloudinary
   * @param id - Breaker ID
   * @param breaker - Updated breaker data with base64 images
   * @returns Observable of updated breaker response
   */
  updateBreakerWithImages(id: string, breaker: Partial<Breaker> & { images: string[] }): Observable<BreakerResponse> {
    return this.http.put<BreakerResponse>(ApiEndpoints.breakers.update(id), breaker);
  }
}
