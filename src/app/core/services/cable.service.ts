// src/app/core/services/cable.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';

// Define the Cable interface (aligns with backend model)
export interface Cable {
  _id: string;
  name: string;
  price: number;
  quantity: 'in stock' | 'out of stock';
  type?: string;
  brand?: string;
  connectorFrom?: string;
  connectorTo?: string;
  stock?: number;
  voltage?: number;
  current?: number;
  phase?: string;
  cableLength?: number;
  wireGauge?: string;
  offer?: {
    enabled: boolean;
    discountPercentage: number;
  };
  description?: string;
  images?: string[];
  finalPrice?: number; // Virtual field from backend
  createdAt?: string;
  updatedAt?: string;
}

// Data format expected by backend (images as string[])
export interface CableBackendData {
  name?: string;
  price?: number;
  quantity?: 'in stock' | 'out of stock';
  type?: string;
  brand?: string;
  connectorFrom?: string;
  connectorTo?: string;
  stock?: number;
  voltage?: number;
  current?: number;
  phase?: string;
  cableLength?: number;
  wireGauge?: string;
  offer?: {
    enabled: boolean;
    discountPercentage: number;
  };
  description?: string;
  images?: string[];
}

// API Response interfaces
interface CableResponse {
  success: boolean;
  cable: Cable;
}

interface CablesResponse {
  success: boolean;
  count: number;
  cables: Cable[];
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CableService {
  constructor(private http: HttpClient) {}

  // Get all cables
  getAllCables(): Observable<CablesResponse> {
    return this.http.get<CablesResponse>(ApiEndpoints.cables.getAll);
  }

  // Get single cable by ID
  getCableById(id: string): Observable<CableResponse> {
    return this.http.get<CableResponse>(ApiEndpoints.cables.getById(id));
  }

  // Create new cable
  createCable(cableData: Partial<CableBackendData>): Observable<CableResponse> {
    return this.http.post<CableResponse>(ApiEndpoints.cables.create, cableData);
  }

  // Update existing cable
  updateCable(id: string, cableData: Partial<CableBackendData>): Observable<CableResponse> {
    return this.http.put<CableResponse>(ApiEndpoints.cables.update(id), cableData);
  }

  // Delete cable
  deleteCable(id: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(ApiEndpoints.cables.delete(id));
  }

  // Helper method to calculate final price
  calculateFinalPrice(cable: Cable): number {
    if (cable.offer?.enabled && cable.offer.discountPercentage > 0) {
      return cable.price - (cable.price * cable.offer.discountPercentage) / 100;
    }
    return cable.price;
  }
}
