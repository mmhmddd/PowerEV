// src/app/core/services/plug.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import {
  Plug,
  PlugsResponse,
  PlugResponse,
  ApiResponse
} from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class PlugService {
  constructor(private http: HttpClient) {}

  getAllPlugs(): Observable<PlugsResponse> {
    return this.http.get<PlugsResponse>(ApiEndpoints.plugs.getAll);
  }

  getPlug(id: string): Observable<PlugResponse> {
    return this.http.get<PlugResponse>(ApiEndpoints.plugs.getById(id));
  }

  createPlug(plug: Partial<Plug>): Observable<PlugResponse> {
    return this.http.post<PlugResponse>(ApiEndpoints.plugs.create, plug);
  }

  updatePlug(id: string, plug: Partial<Plug>): Observable<PlugResponse> {
    return this.http.put<PlugResponse>(ApiEndpoints.plugs.update(id), plug);
  }

  deletePlug(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.plugs.delete(id));
  }
}
