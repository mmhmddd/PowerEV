// src/app/core/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';
import { Cart, CartResponse } from '../models/product.models';

export interface AddToCartRequest {
  productId: string;
  productType: 'Charger' | 'Cable' | 'Station' | 'Adapter' | 'Box' | 'Breaker' | 'Plug' | 'Wire' | 'Other';
  quantity?: number;
}

export interface UpdateCartItemRequest {
  productId: string;
  productType: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private sessionId: string;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    this.sessionId = this.getOrCreateSessionId();
    this.loadCart();
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('cartSessionId');
    if (!sessionId) {
      // Generate UUID v4 manually to avoid dependency
      sessionId = this.generateUUID();
      localStorage.setItem('cartSessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Generate UUID v4 (RFC4122 compliant)
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Normalize cart data to ensure totalPrice is set
   * Backend sends totalAmount, frontend expects totalPrice
   */
  private normalizeCart(cart: any): Cart {
    return {
      ...cart,
      totalPrice: cart.totalAmount || cart.totalPrice || 0
    };
  }

  /**
   * Load cart for current session
   * Creates empty cart if doesn't exist
   */
  loadCart(): void {
    this.getCart(this.sessionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const normalizedCart = this.normalizeCart(response.data);
          this.cartSubject.next(normalizedCart);
          console.log('Cart loaded:', normalizedCart);
        }
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      }
    });
  }

  /**
   * Get cart by session ID
   * Backend creates empty cart if not exists
   * @param sessionId - Session ID
   * @returns Observable of cart response
   */
  getCart(sessionId: string): Observable<CartResponse> {
    return this.http.get<CartResponse>(ApiEndpoints.cart.get(sessionId)).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = this.normalizeCart(response.data);
        }
        return response;
      })
    );
  }

  /**
   * Add item to cart
   * Required: productId, productType
   * Optional: quantity (defaults to 1)
   * Backend validates stock availability
   * @param item - Cart item data
   * @returns Observable of cart response
   */
  addToCart(item: AddToCartRequest): Observable<CartResponse> {
    console.log('CartService: Adding to cart:', item);
    return this.http.post<CartResponse>(
      ApiEndpoints.cart.addItem(this.sessionId),
      item
    ).pipe(
      map(response => {
        console.log('CartService: Add to cart response:', response);
        if (response.success && response.data) {
          response.data = this.normalizeCart(response.data);
        }
        return response;
      }),
      tap(response => {
        if (response.success && response.data) {
          this.cartSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Update cart item quantity
   * Required: productId, productType, quantity
   * Backend validates stock availability
   * @param productId - Product ID
   * @param productType - Product type
   * @param quantity - New quantity
   * @returns Observable of cart response
   */
  updateCartItem(productId: string, productType: string, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(
      ApiEndpoints.cart.updateItem(this.sessionId),
      { productId, productType, quantity }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = this.normalizeCart(response.data);
        }
        return response;
      }),
      tap(response => {
        if (response.success && response.data) {
          this.cartSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Remove item from cart
   * @param productId - Product ID
   * @param productType - Product type
   * @returns Observable of cart response
   */
  removeFromCart(productId: string, productType: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(
      ApiEndpoints.cart.removeItem(this.sessionId, productId, productType)
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = this.normalizeCart(response.data);
        }
        return response;
      }),
      tap(response => {
        if (response.success && response.data) {
          this.cartSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Clear entire cart
   * Sets items to empty array and totalPrice to 0
   * @returns Observable of cart response
   */
  clearCart(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(
      ApiEndpoints.cart.clear(this.sessionId)
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = this.normalizeCart(response.data);
        }
        return response;
      }),
      tap(response => {
        if (response.success && response.data) {
          this.cartSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Get total number of items in cart
   * @returns Total item count
   */
  getCartItemCount(): number {
    const cart = this.cartSubject.value;
    return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
  }

  /**
   * Get cart total amount
   * @returns Total cart amount
   */
  getCartTotal(): number {
    const cart = this.cartSubject.value;
    return cart?.totalPrice || 0;
  }

  /**
   * Get current session ID
   * @returns Session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current cart value
   * @returns Cart or null
   */
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }
}
