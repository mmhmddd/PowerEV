// src/app/core/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import { Order, OrderResponse, OrdersResponse } from '../models/product.models';

// ─────────────────────────────────────────────────────────────────────────────
// Request Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  name:          string;
  phone:         string;
  email?:        string;
  address:       string;
  notes?:        string;
  paymentMethod: 'cash' | 'instapay' | 'vodafonecash';
  /**
   * Optional base64-encoded image.
   * Only included in payload when paymentMethod is instapay or vodafonecash.
   * Backend uploads to Cloudinary and stores the resulting URL on the order.
   */
  paymentScreenshot?: string;
  /** Provide sessionId to create order from cart (backend clears cart automatically) */
  sessionId?: string;
  /** Provide items directly when not using a cart session */
  items?: Array<{
    productId:   string;
    productType: string;
    quantity:    number;
    price:       number;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: 'pending' | 'paid' | 'failed';
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class OrderService {

  constructor(private http: HttpClient) {}

  // ══════════════════════════════════════════════════════════
  // Create
  // ══════════════════════════════════════════════════════════

  /**
   * Create an order.
   * Supply either `sessionId` (cart-based) or `items` (direct).
   * Backend generates orderNumber automatically and clears the cart on success.
   */
  createOrder(order: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(ApiEndpoints.orders.create, order);
  }

  /**
   * Helper: create order from an existing cart session.
   * @param customerInfo  Customer details (name, phone, address, email?, notes?)
   * @param sessionId     Active cart session ID
   * @param paymentMethod cash | instapay | vodafonecash
   * @param paymentScreenshot  Optional base64 image for instapay / vodafonecash
   */
  createOrderFromCart(
    customerInfo: {
      name:    string;
      phone:   string;
      email?:  string;
      address: string;
      notes?:  string;
    },
    sessionId:         string,
    paymentMethod:     'cash' | 'instapay' | 'vodafonecash',
    paymentScreenshot?: string,
  ): Observable<OrderResponse> {
    const payload: CreateOrderRequest = {
      ...customerInfo,
      sessionId,
      paymentMethod,
    };

    if (paymentScreenshot && paymentMethod !== 'cash') {
      payload.paymentScreenshot = paymentScreenshot;
    }

    return this.createOrder(payload);
  }

  /**
   * Helper: create order with explicit item list (no cart required).
   * @param customerInfo  Customer details
   * @param items         Array of order items
   * @param paymentMethod cash | instapay | vodafonecash
   * @param paymentScreenshot  Optional base64 image for instapay / vodafonecash
   */
  createOrderDirect(
    customerInfo: {
      name:    string;
      phone:   string;
      email?:  string;
      address: string;
      notes?:  string;
    },
    items: Array<{
      productId:   string;
      productType: string;
      quantity:    number;
      price:       number;
    }>,
    paymentMethod:     'cash' | 'instapay' | 'vodafonecash',
    paymentScreenshot?: string,
  ): Observable<OrderResponse> {
    const payload: CreateOrderRequest = {
      ...customerInfo,
      items,
      paymentMethod,
    };

    if (paymentScreenshot && paymentMethod !== 'cash') {
      payload.paymentScreenshot = paymentScreenshot;
    }

    return this.createOrder(payload);
  }

  // ══════════════════════════════════════════════════════════
  // Read
  // ══════════════════════════════════════════════════════════

  /** Get all orders — Admin only. Returns newest first. */
  getAllOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(ApiEndpoints.orders.getAll);
  }

  /** Get a single order by MongoDB _id. Public access. */
  getOrderById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(ApiEndpoints.orders.getById(id));
  }

  /**
   * Track order by order number (format: ORD-{timestamp}-{random}).
   * Public access — anyone with the order number can track it.
   */
  trackOrder(orderNumber: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(ApiEndpoints.orders.trackByOrderNumber(orderNumber));
  }

  /** Get the currently logged-in user's orders. Requires auth. */
  getMyOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(ApiEndpoints.orders.getMyOrders);
  }

  // ══════════════════════════════════════════════════════════
  // Update
  // ══════════════════════════════════════════════════════════

  /**
   * Update order status — Admin only.
   * Valid: pending | confirmed | processing | shipped | delivered | cancelled
   */
  updateOrderStatus(id: string, status: string): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(
      ApiEndpoints.orders.updateStatus(id),
      { status },
    );
  }

  /**
   * Update payment status — Admin only.
   * Valid: pending | paid | failed
   */
  updatePaymentStatus(id: string, paymentStatus: string): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(
      ApiEndpoints.orders.updatePaymentStatus(id),
      { paymentStatus },
    );
  }

  /**
   * Full order update — Admin only.
   * Can update: name, phone, email, address, status, notes,
   *             paymentMethod, paymentStatus, paymentScreenshot.
   *
   * paymentScreenshot behaviour (mirrors backend):
   *   string  → new base64 image   → backend uploads to Cloudinary
   *   null    → admin removed it   → backend deletes from Cloudinary
   *   omitted → no change          → backend keeps existing URL
   */
  updateOrder(id: string, data: Partial<Order> & { paymentScreenshot?: string | null }): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(ApiEndpoints.orders.update(id), data);
  }

  // ══════════════════════════════════════════════════════════
  // Delete
  // ══════════════════════════════════════════════════════════

  /**
   * Delete order — Admin only.
   * Backend also restores product stock and deletes the payment screenshot
   * from Cloudinary (if one exists).
   */
  deleteOrder(id: string): Observable<OrderResponse> {
    return this.http.delete<OrderResponse>(ApiEndpoints.orders.delete(id));
  }
}
