import { Address } from './address.model';
// OrderItemStatus enum'ını ve RefundStatus enum'ını order-item.model.ts dosyasından import et
import { OrderItemStatus, RefundStatus } from './order-item.model';

// ProductLite interface'i artık OrderItem içinde doğrudan kullanılmayacağı için kaldırılabilir veya
// başka bir yerde kullanılıyorsa kalabilir. Şimdilik yorum satırına alıyorum veya siliyorum.
/* 
export interface ProductLite {
  id: number;
  name: string;
  imageUrls?: string[];
}
*/

// Yeni OrderItemStatus tipi
/*
export type OrderItemStatus =
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'EXCHANGED'
  | 'CANCELLED' // Muhtemelen müşteri tarafından
  | 'CANCELLED_BY_SELLER'; // Satıcı tarafından
*/

export interface OrderItem {
  id?: number;
  productId?: number; // Backend DTO'sundan gelen productId
  productName?: string; // Backend DTO'sundan gelen productName
  imageUrl?: string; // Backend DTO'sundan gelen imageUrl
  quantity: number;
  priceAtPurchase: number;
  status: OrderItemStatus; // Bu artık import edilen enum'ı kullanacak
  // İade işlemleri için eklenen alanlar
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundRequestedAt?: Date;
  refundProcessedAt?: Date;
  order?: any; // Tip çakışmalarını önlemek için any olarak belirtildi
  // Satıcı bilgileri
  sellerId?: number;
  sellerName?: string;
}

export interface Order {
  id: number;
  orderTrackingNumber?: string;
  userId: number;
  customerId?: number;
  customerFullName?: string; // DTO'dan gelecek müşteri adı
  createdAt: string;
  status: string;
  totalPrice: number;
  items: OrderItem[]; // Bu artık güncellenmiş OrderItem'ı kullanacak
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod?: string;
  notes?: string;
  address?: Address; // DTO'dan gelecek adres bilgisi
  paymentIntentId?: string;
} 