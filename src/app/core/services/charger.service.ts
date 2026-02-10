// src/app/core/services/charger.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';

// ═══════════════════════════════════════════════════════
// Type Definitions - Matches Backend Models
// ═══════════════════════════════════════════════════════

/**
 * Offer structure for Charger
 */
export interface ChargerOffer {
  enabled: boolean;
  discountPercentage: number;
}

/**
 * Image object structure
 */
export interface ImageObject {
  url: string;
  publicId?: string;
}

/**
 * Charger model - matches backend schema
 */
export interface Charger {
  _id: string;
  name: string;
  price: number;
  quantity: 'in stock' | 'out of stock'; // String enum, not number
  voltage?: number;
  amperage?: number;
  brand?: string;
  stock?: number;
  offer?: ChargerOffer; // Object with enabled and discountPercentage
  connectorType?: string;
  phase?: string;
  efficiency?: number;
  description?: string;
  images?: (string | ImageObject)[]; // Can be string URLs or objects
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

export interface ChargerResponse extends ApiResponse<Charger> {
  charger: Charger;
}

export interface ChargersResponse extends ApiResponse<Charger[]> {
  count: number;
  chargers: Charger[];
}

// ═══════════════════════════════════════════════════════
// Charger Service
// ═══════════════════════════════════════════════════════

@Injectable({
  providedIn: 'root'
})
export class ChargerService {
  constructor(private http: HttpClient) {}

  /**
   * Get all chargers
   * @returns Observable of chargers response
   */
  getAllChargers(): Observable<ChargersResponse> {
    return this.http.get<ChargersResponse>(ApiEndpoints.chargers.getAll);
  }

  /**
   * Get single charger by ID
   * @param id - Charger ID
   * @returns Observable of charger response
   */
  getCharger(id: string): Observable<ChargerResponse> {
    return this.http.get<ChargerResponse>(ApiEndpoints.chargers.getById(id));
  }

  /**
   * Create new charger (Admin only)
   * Required fields: name, price, quantity
   * Optional fields: voltage, amperage, brand, stock, offer, connectorType, phase,
   *                  efficiency, description, images
   * @param charger - Charger data
   * @returns Observable of created charger response
   */
  createCharger(charger: Partial<Charger>): Observable<ChargerResponse> {
    return this.http.post<ChargerResponse>(ApiEndpoints.chargers.create, charger);
  }

  /**
   * Update charger (Admin only)
   * All fields are optional
   * @param id - Charger ID
   * @param charger - Updated charger data
   * @returns Observable of updated charger response
   */
  updateCharger(id: string, charger: Partial<Charger>): Observable<ChargerResponse> {
    return this.http.put<ChargerResponse>(ApiEndpoints.chargers.update(id), charger);
  }

  /**
   * Delete charger (Admin only)
   * Also deletes associated images from Cloudinary
   * @param id - Charger ID
   * @returns Observable of delete response
   */
  deleteCharger(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.chargers.delete(id));
  }

  /**
   * Upload charger with images (base64)
   * Images will be automatically uploaded to Cloudinary
   * @param charger - Charger data with base64 images
   * @returns Observable of created charger response
   */
  createChargerWithImages(charger: Partial<Charger> & { images: string[] }): Observable<ChargerResponse> {
    return this.http.post<ChargerResponse>(ApiEndpoints.chargers.create, charger);
  }

  /**
   * Update charger with new images (base64)
   * Old images will be deleted from Cloudinary
   * @param id - Charger ID
   * @param charger - Updated charger data with base64 images
   * @returns Observable of updated charger response
   */
  updateChargerWithImages(id: string, charger: Partial<Charger> & { images: string[] }): Observable<ChargerResponse> {
    return this.http.put<ChargerResponse>(ApiEndpoints.chargers.update(id), charger);
  }

  /**
   * Calculate final price after discount
   * @param charger - Charger with offer
   * @returns Final price after discount
   */
  calculateFinalPrice(charger: Charger): number {
    if (charger.offer?.enabled && charger.offer.discountPercentage > 0) {
      return charger.price - (charger.price * charger.offer.discountPercentage) / 100;
    }
    return charger.price;
  }
}
