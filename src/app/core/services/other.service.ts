// src/app/core/services/other.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';

// ═══════════════════════════════════════════════════════
// Type Definitions - Matches Backend Models
// ═══════════════════════════════════════════════════════

/**
 * Image object structure
 */
export interface ImageObject {
  url: string;
  publicId?: string;
}

/**
 * Other product model - matches backend schema
 * CRITICAL: offer is a NUMBER (0-100 percentage), NOT an object
 */
export interface Other {
  _id: string;
  name: string;
  price: number;
  description?: string;
  images?: (string | ImageObject)[]; // Can be string URLs or objects
  brand?: string;
  type?: string;
  stock: number;
  offer?: number; // NUMBER representing percentage (0-100), not an object
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * API Response structures
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
}

export interface OtherResponse extends ApiResponse<Other> {
  other: Other;
}

export interface OthersResponse extends ApiResponse<Other[]> {
  count: number;
  others: Other[];
}

// ═══════════════════════════════════════════════════════
// Other Service
// ═══════════════════════════════════════════════════════

@Injectable({
  providedIn: 'root'
})
export class OtherService {
  constructor(private http: HttpClient) {}

  /**
   * Get all other products
   * @returns Observable of others response
   */
  getAllOthers(): Observable<OthersResponse> {
    return this.http.get<OthersResponse>(ApiEndpoints.others.getAll);
  }

  /**
   * Get single other product by ID
   * @param id - Other product ID
   * @returns Observable of other response
   */
  getOther(id: string): Observable<OtherResponse> {
    return this.http.get<OtherResponse>(ApiEndpoints.others.getById(id));
  }

  /**
   * Create new other product (Admin only)
   * Required fields: name, price, stock
   * Optional fields: description, images, brand, type, offer
   * @param other - Other product data
   * @returns Observable of created other response
   */
  createOther(other: Partial<Other>): Observable<OtherResponse> {
    return this.http.post<OtherResponse>(ApiEndpoints.others.create, other);
  }

  /**
   * Update other product (Admin only)
   * All fields are optional
   * @param id - Other product ID
   * @param other - Updated other data
   * @returns Observable of updated other response
   */
  updateOther(id: string, other: Partial<Other>): Observable<OtherResponse> {
    return this.http.put<OtherResponse>(ApiEndpoints.others.update(id), other);
  }

  /**
   * Delete other product (Admin only)
   * Also deletes associated images from Cloudinary
   * @param id - Other product ID
   * @returns Observable of delete response
   */
  deleteOther(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.others.delete(id));
  }

  /**
   * Upload other with images (base64)
   * Images will be automatically uploaded to Cloudinary
   * @param other - Other data with base64 images
   * @returns Observable of created other response
   */
  createOtherWithImages(other: Partial<Other> & { images: string[] }): Observable<OtherResponse> {
    return this.http.post<OtherResponse>(ApiEndpoints.others.create, other);
  }

  /**
   * Update other with new images (base64)
   * Old images will be deleted from Cloudinary
   * @param id - Other product ID
   * @param other - Updated other data with base64 images
   * @returns Observable of updated other response
   */
  updateOtherWithImages(id: string, other: Partial<Other> & { images: string[] }): Observable<OtherResponse> {
    return this.http.put<OtherResponse>(ApiEndpoints.others.update(id), other);
  }

  /**
   * Calculate final price after discount
   * @param other - Other product with offer
   * @returns Final price after discount
   */
  calculateFinalPrice(other: Other): number {
    if (other.offer && other.offer > 0) {
      return other.price - (other.price * other.offer) / 100;
    }
    return other.price;
  }
}
