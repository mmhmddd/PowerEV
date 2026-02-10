import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface GalleryItem {
  _id: string;
  image: string;
  title?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryResponse {
  success: boolean;
  count?: number;
  galleryItems?: GalleryItem[];
  galleryItem?: GalleryItem;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GalleryService {

  constructor(private http: HttpClient) { }

  // Get all gallery items
  getAllGalleryItems(): Observable<GalleryResponse> {
    return this.http.get<GalleryResponse>(ApiEndpoints.gallery.getAll);
  }

  // Get single gallery item
  getGalleryItem(id: string): Observable<GalleryResponse> {
    return this.http.get<GalleryResponse>(ApiEndpoints.gallery.getById(id));
  }

  // Create gallery item
  createGalleryItem(galleryData: any): Observable<GalleryResponse> {
    return this.http.post<GalleryResponse>(ApiEndpoints.gallery.create, galleryData);
  }

  // Update gallery item
  updateGalleryItem(id: string, galleryData: any): Observable<GalleryResponse> {
    return this.http.put<GalleryResponse>(ApiEndpoints.gallery.update(id), galleryData);
  }

  // Delete gallery item
  deleteGalleryItem(id: string): Observable<GalleryResponse> {
    return this.http.delete<GalleryResponse>(ApiEndpoints.gallery.delete(id));
  }
}
