// src/app/core/services/box.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import {
  Box,
  BoxesResponse,
  BoxResponse,
  ApiResponse,
  ImageObject
} from '../models/product.models';

// Backend expects images as string[] (base64 or URLs)
export interface BoxBackendData extends Omit<Box, 'images'> {
  images?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BoxService {
  constructor(private http: HttpClient) {}

  /**
   * Get all boxes
   * @returns Observable of boxes response
   */
  getAllBoxes(): Observable<BoxesResponse> {
    return this.http.get<BoxesResponse>(ApiEndpoints.boxes.getAll);
  }

  /**
   * Get single box by ID
   * @param id - Box ID
   * @returns Observable of box response
   */
  getBox(id: string): Observable<BoxResponse> {
    return this.http.get<BoxResponse>(ApiEndpoints.boxes.getById(id));
  }

  /**
   * Create new box (Admin only)
   * Required fields: name, price, stock
   * Optional fields: brand, description, images, size, quantity, offer
   * @param box - Box data (with images as string[])
   * @returns Observable of created box response
   */
  createBox(box: Partial<BoxBackendData>): Observable<BoxResponse> {
    return this.http.post<BoxResponse>(ApiEndpoints.boxes.create, box);
  }

  /**
   * Update box (Admin only)
   * All fields are optional
   * @param id - Box ID
   * @param box - Updated box data (with images as string[])
   * @returns Observable of updated box response
   */
  updateBox(id: string, box: Partial<BoxBackendData>): Observable<BoxResponse> {
    return this.http.put<BoxResponse>(ApiEndpoints.boxes.update(id), box);
  }

  /**
   * Delete box (Admin only)
   * Also deletes associated images from Cloudinary
   * @param id - Box ID
   * @returns Observable of delete response
   */
  deleteBox(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.boxes.delete(id));
  }

  /**
   * Upload box with images (base64)
   * Images will be automatically uploaded to Cloudinary
   * @param box - Box data with base64 images
   * @returns Observable of created box response
   */
  createBoxWithImages(box: Partial<Box> & { images: string[] }): Observable<BoxResponse> {
    return this.http.post<BoxResponse>(ApiEndpoints.boxes.create, box);
  }

  /**
   * Update box with new images (base64)
   * Old images will be deleted from Cloudinary
   * @param id - Box ID
   * @param box - Updated box data with base64 images
   * @returns Observable of updated box response
   */
  updateBoxWithImages(id: string, box: Partial<Box> & { images: string[] }): Observable<BoxResponse> {
    return this.http.put<BoxResponse>(ApiEndpoints.boxes.update(id), box);
  }
}
