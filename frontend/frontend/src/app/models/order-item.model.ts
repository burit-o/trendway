// frontend/frontend/src/app/models/order-item.model.ts
// Product modelinin var olduğunu ve doğru yolda olduğunu varsayıyoruz.
// Eğer product.model.ts farklı bir yoldaysa veya henüz oluşturulmadıysa, import yolu güncellenmeli veya model oluşturulmalıdır.
import { Product } from './product.model'; 

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  priceAtPurchase: number;
  status: OrderItemStatus;
  // Backend OrderItem modelinizdeki diğer alanlar buraya eklenebilir
  // Örneğin:
  // subtotal: number; 
  // sellerId: number;
  // orderId: number;
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
  CANCELLED_BY_SELLER = 'CANCELLED_BY_SELLER',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURN_APPROVED = 'RETURN_APPROVED',
  RETURN_REJECTED = 'RETURN_REJECTED',
  RETURNED = 'RETURNED',
  EXCHANGE_REQUESTED = 'EXCHANGE_REQUESTED',
  EXCHANGE_APPROVED = 'EXCHANGE_APPROVED',
  EXCHANGE_REJECTED = 'EXCHANGE_REJECTED',
  EXCHANGED = 'EXCHANGED'
  // Backend Enum ile aynı değerlere sahip olmalıdır
} 