import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface CheckoutItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface ShippingForm {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  governorate: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  orderItems: CheckoutItem[] = [
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

  shippingData: ShippingForm = {
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    governorate: 'القاهرة'
  };

  governorates: string[] = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'أخرى'
  ];

  get totalAmount(): number {
    return this.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  onSubmit(): void {
    console.log('Order submitted:', this.shippingData);
    // Handle order submission logic here
    alert('تم تأكيد طلبك بنجاح! سيتم التواصل معك قريباً.');
  }
}
