import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  cartItems: CartItem[] = [
    {
      id: 1,
      name: 'كابل شحن Type 2',
      price: 1200,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1646719000106-963507639034?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 2,
      name: 'محول شحن محمول',
      price: 800,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800'
    }
  ];

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get total(): number {
    return this.subtotal; // Add shipping calculation here if needed
  }

  increaseQuantity(item: CartItem): void {
    item.quantity++;
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
    }
  }

  removeItem(itemId: number): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
  }
}
