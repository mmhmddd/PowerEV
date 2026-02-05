// src/app/core/services/other.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import {
  Other,
  OthersResponse,
  OtherResponse,
  ApiResponse
} from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class OtherService {
  constructor(private http: HttpClient) {}

  getAllOthers(): Observable<OthersResponse> {
    return this.http.get<OthersResponse>(ApiEndpoints.others.getAll);
  }

  getOther(id: string): Observable<OtherResponse> {
    return this.http.get<OtherResponse>(ApiEndpoints.others.getById(id));
  }

  createOther(other: Partial<Other>): Observable<OtherResponse> {
    return this.http.post<OtherResponse>(ApiEndpoints.others.create, other);
  }

  updateOther(id: string, other: Partial<Other>): Observable<OtherResponse> {
    return this.http.put<OtherResponse>(ApiEndpoints.others.update(id), other);
  }

  deleteOther(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.others.delete(id));
  }
}
