// src/app/core/services/adapter.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import {
  Adapter,
  AdaptersResponse,
  AdapterResponse,
  ApiResponse
} from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class AdapterService {
  constructor(private http: HttpClient) {}

  /**
   * Get all adapters
   * @returns Observable of adapters response
   */
  getAllAdapters(): Observable<AdaptersResponse> {
    return this.http.get<AdaptersResponse>(ApiEndpoints.adapters.getAll);
  }

  /**
   * Get single adapter by ID
   * @param id - Adapter ID
   * @returns Observable of adapter response
   */
  getAdapter(id: string): Observable<AdapterResponse> {
    return this.http.get<AdapterResponse>(ApiEndpoints.adapters.getById(id));
  }

  /**
   * Create new adapter (Admin only)
   * Required fields: name, price
   * Optional fields: type, brand, stock, efficiency, voltage, current, description, images
   * @param adapter - Adapter data
   * @returns Observable of created adapter response
   */
  createAdapter(adapter: Partial<Adapter>): Observable<AdapterResponse> {
    return this.http.post<AdapterResponse>(ApiEndpoints.adapters.create, adapter);
  }

  /**
   * Update adapter (Admin only)
   * All fields are optional
   * @param id - Adapter ID
   * @param adapter - Updated adapter data
   * @returns Observable of updated adapter response
   */
  updateAdapter(id: string, adapter: Partial<Adapter>): Observable<AdapterResponse> {
    return this.http.put<AdapterResponse>(ApiEndpoints.adapters.update(id), adapter);
  }

  /**
   * Delete adapter (Admin only)
   * Also deletes associated images from Cloudinary
   * @param id - Adapter ID
   * @returns Observable of delete response
   */
  deleteAdapter(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.adapters.delete(id));
  }

  /**
   * Upload adapter with images (base64)
   * Images will be automatically uploaded to Cloudinary
   * @param adapter - Adapter data with base64 images
   * @returns Observable of created adapter response
   */
  createAdapterWithImages(adapter: Partial<Adapter> & { images: string[] }): Observable<AdapterResponse> {
    return this.http.post<AdapterResponse>(ApiEndpoints.adapters.create, adapter);
  }

  /**
   * Update adapter with new images (base64)
   * Old images will be deleted from Cloudinary
   * @param id - Adapter ID
   * @param adapter - Updated adapter data with base64 images
   * @returns Observable of updated adapter response
   */
  updateAdapterWithImages(id: string, adapter: Partial<Adapter> & { images: string[] }): Observable<AdapterResponse> {
    return this.http.put<AdapterResponse>(ApiEndpoints.adapters.update(id), adapter);
  }
}
