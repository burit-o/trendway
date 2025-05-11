import { Address } from './address.model';

// Product için basit bir arayüz (OrderItem içinde kullanılacak)
export interface ProductLite {
  id: number;
  name: string;
  imageUrls?: string[]; // Backend'deki Product modeline göre ayarlanmalı
  // Gerekirse diğer product alanları eklenebilir
}

export interface OrderItem {
  id?: number;
  product: ProductLite; // productName ve imageUrl yerine product nesnesi
  quantity: number;
  priceAtPurchase: number; // price -> priceAtPurchase
  status: string; // OrderItemStatus (örn: 'PREPARING', 'SHIPPED', 'DELIVERED')
  // productId alanı backend'den geliyorsa ve gerekliyse eklenebilir,
  // ancak product.id üzerinden erişilebilir.
}

export interface Order {
  id: number;
  orderTrackingNumber?: string;
  userId: number; // veya customer: UserLite;
  createdAt: string; // orderDate -> createdAt
  status: string; // OrderStatus (örn: 'PREPARING', 'SHIPPED', 'DELIVERED')
  totalPrice: number; // totalAmount -> totalPrice
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod?: string;
  notes?: string;
} 