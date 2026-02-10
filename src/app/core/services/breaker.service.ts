// src/app/core/services/breaker.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';

// Define the Breaker interface (aligns with backend model)
export interface Breaker {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  description?: string;
  images?: string[];
  stock: number;
  quantity?: number;
  offer?: number;
  ampere?: number;
  voltage?: number;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Data format expected by backend (images as string[])
export interface BreakerBackendData {
  name?: string;
  brand?: string;
  price?: number;
  description?: string;
  images?: string[];
  stock?: number;
  quantity?: number;
  offer?: number;
  ampere?: number;
  voltage?: number;
  type?: string;
}

// API Response interfaces
interface BreakerResponse {
  success: boolean;
  breaker: Breaker;
}

interface BreakersResponse {
  success: boolean;
  count: number;
  breakers: Breaker[];
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreakerService {
  constructor(private http: HttpClient) {}

  // Get all breakers
  getAllBreakers(): Observable<BreakersResponse> {
    return this.http.get<BreakersResponse>(ApiEndpoints.breakers.getAll);
  }

  // Get single breaker by ID
  getBreakerById(id: string): Observable<BreakerResponse> {
    return this.http.get<BreakerResponse>(ApiEndpoints.breakers.getById(id));
  }

  // Create new breaker
  createBreaker(breakerData: Partial<BreakerBackendData>): Observable<BreakerResponse> {
    return this.http.post<BreakerResponse>(ApiEndpoints.breakers.create, breakerData);
  }

  // Update existing breaker
  updateBreaker(id: string, breakerData: Partial<BreakerBackendData>): Observable<BreakerResponse> {
    return this.http.put<BreakerResponse>(ApiEndpoints.breakers.update(id), breakerData);
  }

  // Delete breaker
  deleteBreaker(id: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(ApiEndpoints.breakers.delete(id));
  }
}
