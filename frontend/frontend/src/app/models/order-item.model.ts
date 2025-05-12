// frontend/frontend/src/app/models/order-item.model.ts
// Product modelinin var olduğunu ve doğru yolda olduğunu varsayıyoruz.
// Eğer product.model.ts farklı bir yoldaysa veya henüz oluşturulmadıysa, import yolu güncellenmeli veya model oluşturulmalıdır.
import { Product } from './product.model'; 

// Backend ile uyumlu RefundStatus enum'u
export enum RefundStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export interface OrderItem {
  id: number;
  product?: Product; // Opsiyonel hale getiriyorum order.model.ts ile uyumlu olması için
  quantity: number;
  priceAtPurchase: number;
  status: OrderItemStatus;
  // İade işlemleri için eklenmiş özellikler
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundRequestedAt?: Date;
  refundProcessedAt?: Date;
  // Backend tarafından gönderilen ek alanlar
  productName?: string;
  imageUrl?: string;
  order?: any; // Tip çakışmalarını önlemek için any olarak belirtildi
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