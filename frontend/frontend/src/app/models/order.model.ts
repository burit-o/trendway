import { Address } from './address.model';

// ProductLite interface'i artık OrderItem içinde doğrudan kullanılmayacağı için kaldırılabilir veya
// başka bir yerde kullanılıyorsa kalabilir. Şimdilik yorum satırına alıyorum veya siliyorum.
/* 
export interface ProductLite {
  id: number;
  name: string;
  imageUrls?: string[];
}
*/

export interface OrderItem {
  id?: number;
  productId?: number; // Backend DTO'sundan gelen productId
  productName?: string; // Backend DTO'sundan gelen productName
  imageUrl?: string; // Backend DTO'sundan gelen imageUrl
  quantity: number;
  priceAtPurchase: number;
  status: string;
}

export interface Order {
  id: number;
  orderTrackingNumber?: string;
  userId: number;
  createdAt: string;
  status: string;
  totalPrice: number;
  items: OrderItem[]; // Bu artık güncellenmiş OrderItem'ı kullanacak
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod?: string;
  notes?: string;
} 