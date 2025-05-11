import { Address } from './address.model';

export interface OrderItem {
    id?: number;
    productId: number;
    productName: string;
    quantity: number;
    price: number; // O anki ürün fiyatı
    imageUrl?: string; // Ürünün küçük resmi için opsiyonel
}

export interface Order {
    id: number;
    orderTrackingNumber?: string; // Sipariş takip numarası, opsiyonel
    userId: number;
    orderDate: string; // veya Date
    status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | string;
    totalAmount: number;
    items: OrderItem[];
    shippingAddress: Address; // veya Address ID ve sonra detayları çekilebilir
    billingAddress?: Address; // Opsiyonel
    paymentMethod?: string; // Opsiyonel
    notes?: string; // Müşteri notları, opsiyonel
} 