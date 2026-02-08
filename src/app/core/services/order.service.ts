// src/app/core/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import { Order, OrderResponse, OrdersResponse } from '../models/product.models';

export interface CreateOrderRequest {
  name: string;
  phone: string;
  email?: string;
  address: string;
  items?: Array<{
    productId: string;
    productType: string;
    quantity: number;
    price: number;
  }>;
  sessionId?: string;
  notes?: string;
  paymentMethod: 'cash' | 'instapay' | 'vodafonecash';
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: 'pending' | 'paid' | 'failed';
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient) {}

  /**
   * Create order from cart or direct items
   * Required: name, phone, address, paymentMethod
   * Optional: email, notes
   * Either provide sessionId (to get items from cart) OR items array
   * Backend generates order number automatically
   * Backend clears cart if order created from cart
   * @param order - Order data
   * @returns Observable of order response
   */
  createOrder(order: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(ApiEndpoints.orders.create, order);
  }

  /**
   * Get all orders (Admin only)
   * Returns orders sorted by creation date (newest first)
   * @returns Observable of orders response
   */
  getAllOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(ApiEndpoints.orders.getAll);
  }

  /**
   * Get single order by ID
   * Public access (anyone with ID can view)
   * @param id - Order ID
   * @returns Observable of order response
   */
  getOrderById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(ApiEndpoints.orders.getById(id));
  }

  /**
   * Get logged-in user's orders
   * Requires authentication
   * Returns orders sorted by creation date (newest first)
   * @returns Observable of orders response
   */
  getMyOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(ApiEndpoints.orders.getMyOrders);
  }

  /**
   * Track order by order number
   * Public access (anyone with order number can track)
   * Order number format: ORD-{timestamp}-{random}
   * @param orderNumber - Order number from confirmation
   * @returns Observable of order response
   */
  trackOrder(orderNumber: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(ApiEndpoints.orders.trackByOrderNumber(orderNumber));
  }

  /**
   * Update order status (Admin only)
   * Valid statuses: pending, confirmed, processing, shipped, delivered, cancelled
   * @param id - Order ID
   * @param status - New status
   * @returns Observable of order response
   */
  updateOrderStatus(id: string, status: string): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(
      ApiEndpoints.orders.updateStatus(id),
      { status }
    );
  }

  /**
   * Update payment status (Admin only)
   * Valid statuses: pending, paid, failed
   * @param id - Order ID
   * @param paymentStatus - New payment status
   * @returns Observable of order response
   */
  updatePaymentStatus(id: string, paymentStatus: string): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(
      ApiEndpoints.orders.updatePaymentStatus(id),
      { paymentStatus }
    );
  }

  /**
   * Update order details (Admin only)
   * Can update: name, phone, email, address, status, notes, paymentMethod, paymentStatus
   * @param id - Order ID
   * @param data - Updated order data
   * @returns Observable of order response
   */
  updateOrder(id: string, data: Partial<Order>): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(ApiEndpoints.orders.update(id), data);
  }

  /**
   * Delete order (Admin only)
   * @param id - Order ID
   * @returns Observable of response
   */
  deleteOrder(id: string): Observable<OrderResponse> {
    return this.http.delete<OrderResponse>(ApiEndpoints.orders.delete(id));
  }

  /**
   * Helper: Create order from cart
   * @param customerInfo - Customer information
   * @param sessionId - Cart session ID
   * @param paymentMethod - Payment method
   * @returns Observable of order response
   */
  createOrderFromCart(customerInfo: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    notes?: string;
  }, sessionId: string, paymentMethod: 'cash' | 'instapay' | 'vodafonecash'): Observable<OrderResponse> {
    return this.createOrder({
      ...customerInfo,
      sessionId,
      paymentMethod
    });
  }

  /**
   * Helper: Create order with direct items (no cart)
   * @param customerInfo - Customer information
   * @param items - Order items
   * @param paymentMethod - Payment method
   * @returns Observable of order response
   */
  createOrderDirect(customerInfo: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    notes?: string;
  }, items: Array<{
    productId: string;
    productType: string;
    quantity: number;
    price: number;
  }>, paymentMethod: 'cash' | 'instapay' | 'vodafonecash'): Observable<OrderResponse> {
    return this.createOrder({
      ...customerInfo,
      items,
      paymentMethod
    });
  }
}
