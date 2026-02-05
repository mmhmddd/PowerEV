// src/app/core/services/cable.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import {
  Cable,
  CablesResponse,
  CableResponse,
  ApiResponse
} from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class CableService {
  constructor(private http: HttpClient) {}

  /**
   * Get all cables
   * @returns Observable of cables response
   */
  getAllCables(): Observable<CablesResponse> {
    return this.http.get<CablesResponse>(ApiEndpoints.cables.getAll);
  }

  /**
   * Get single cable by ID
   * @param id - Cable ID
   * @returns Observable of cable response
   */
  getCable(id: string): Observable<CableResponse> {
    return this.http.get<CableResponse>(ApiEndpoints.cables.getById(id));
  }

  /**
   * Create new cable (Admin only)
   * Required fields: name, price, quantity
   * Optional fields: type, brand, connectorFrom, connectorTo, stock, voltage, current, phase,
   *                  cableLength, wireGauge, offer, description, images
   * @param cable - Cable data
   * @returns Observable of created cable response
   */
  createCable(cable: Partial<Cable>): Observable<CableResponse> {
    return this.http.post<CableResponse>(ApiEndpoints.cables.create, cable);
  }

  /**
   * Update cable (Admin only)
   * All fields are optional
   * @param id - Cable ID
   * @param cable - Updated cable data
   * @returns Observable of updated cable response
   */
  updateCable(id: string, cable: Partial<Cable>): Observable<CableResponse> {
    return this.http.put<CableResponse>(ApiEndpoints.cables.update(id), cable);
  }

  /**
   * Delete cable (Admin only)
   * Also deletes associated images from Cloudinary
   * @param id - Cable ID
   * @returns Observable of delete response
   */
  deleteCable(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.cables.delete(id));
  }

  /**
   * Upload cable with images (base64)
   * Images will be automatically uploaded to Cloudinary
   * @param cable - Cable data with base64 images
   * @returns Observable of created cable response
   */
  createCableWithImages(cable: Partial<Cable> & { images: string[] }): Observable<CableResponse> {
    return this.http.post<CableResponse>(ApiEndpoints.cables.create, cable);
  }

  /**
   * Update cable with new images (base64)
   * Old images will be deleted from Cloudinary
   * @param id - Cable ID
   * @param cable - Updated cable data with base64 images
   * @returns Observable of updated cable response
   */
  updateCableWithImages(id: string, cable: Partial<Cable> & { images: string[] }): Observable<CableResponse> {
    return this.http.put<CableResponse>(ApiEndpoints.cables.update(id), cable);
  }

  /**
   * Calculate final price after discount
   * Note: Backend returns finalPrice as a virtual field
   * @param cable - Cable with offer
   * @returns Final price after discount
   */
  calculateFinalPrice(cable: Cable): number {
    if (cable.offer?.enabled && cable.offer.discountPercentage > 0) {
      return cable.price - (cable.price * cable.offer.discountPercentage) / 100;
    }
    return cable.price;
  }
}
