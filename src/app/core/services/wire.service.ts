// src/app/core/services/wire.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import {
  Wire,
  WiresResponse,
  WireResponse,
  ApiResponse
} from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class WireService {
  constructor(private http: HttpClient) {}

  getAllWires(): Observable<WiresResponse> {
    return this.http.get<WiresResponse>(ApiEndpoints.wires.getAll);
  }

  getWire(id: string): Observable<WireResponse> {
    return this.http.get<WireResponse>(ApiEndpoints.wires.getById(id));
  }

  createWire(wire: Partial<Wire>): Observable<WireResponse> {
    return this.http.post<WireResponse>(ApiEndpoints.wires.create, wire);
  }

  updateWire(id: string, wire: Partial<Wire>): Observable<WireResponse> {
    return this.http.put<WireResponse>(ApiEndpoints.wires.update(id), wire);
  }

  deleteWire(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.wires.delete(id));
  }
}
