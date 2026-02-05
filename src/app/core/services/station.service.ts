// src/app/core/services/station.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import {
  Station,
  StationsResponse,
  StationResponse,
  ApiResponse
} from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class StationService {
  constructor(private http: HttpClient) {}

  getAllStations(): Observable<StationsResponse> {
    return this.http.get<StationsResponse>(ApiEndpoints.stations.getAll);
  }

  getStation(id: string): Observable<StationResponse> {
    return this.http.get<StationResponse>(ApiEndpoints.stations.getById(id));
  }

  createStation(station: Partial<Station>): Observable<StationResponse> {
    return this.http.post<StationResponse>(ApiEndpoints.stations.create, station);
  }

  updateStation(id: string, station: Partial<Station>): Observable<StationResponse> {
    return this.http.put<StationResponse>(ApiEndpoints.stations.update(id), station);
  }

  deleteStation(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(ApiEndpoints.stations.delete(id));
  }

  calculateFinalPrice(station: Station): number {
    if (station.offer?.enabled && station.offer.discountPercentage > 0) {
      return station.price - (station.price * station.offer.discountPercentage) / 100;
    }
    return station.price;
  }
}
