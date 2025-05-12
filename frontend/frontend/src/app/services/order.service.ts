import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';
import { OrderItem } from '../models/order-item.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:8080/api/orders'; // Backend API URL'nizi buraya girin

  constructor(private http: HttpClient) { }

  // Kullanıcının tüm siparişlerini getir
  getOrdersByUserId(userId: number): Observable<Order[]> {
    // Backend endpoint'i /api/orders/user/{userId} şeklinde olabilir
    // return this.http.get<Order[]>(`${this.apiUrl}/user/${userId}`); // Eski hali
    return this.http.get<Order[]>(`${this.apiUrl}/by-customer`, { params: { userId: userId.toString() } }); // Yeni hali
  }

  // Belirli bir siparişin detaylarını getir (eğer gerekirse)
  getOrderById(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
  }

  checkIfUserPurchasedProduct(productId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check-purchase`, { params: { productId: productId.toString() } });
  }

  placeOrderFromCart(userId: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/from-cart`, null, { 
      params: { 
        userId: userId.toString() 
      } 
    });
  }
  
  // Satıcının siparişlerini getir
  getOrdersBySeller(): Observable<Order[]> {
    // Backend endpoint'i GET /api/orders/seller
    // Token interceptor'ı sellerId'yi Principal'dan alacak şekilde ayarlandı backend'de.
    return this.http.get<Order[]>(`${this.apiUrl}/seller`);
  }

  // Admin için tüm siparişleri getir
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/all`);
  }

  // Sipariş kaleminin durumunu güncelle (genel amaçlı)
  updateOrderItemStatus(orderItemId: number, status: string): Observable<any> {
    console.log(`Calling API to update order item ${orderItemId} status to ${status}`);
    
    // Backend URL: /api/orders/update-item-status?orderItemId=123&status=SHIPPED
    // Backend endpoint'i bir body beklemiyor, sadece query parametreleri alıyor
    return this.http.put(`${this.apiUrl}/update-item-status`, null, {
      params: {
        orderItemId: orderItemId.toString(),
        status: status
      },
      responseType: 'text' // Backend text response döndürüyor
    });
  }

  // Satıcının bir sipariş kalemini iptal etmesi
  cancelOrderItemBySeller(orderItemId: number): Observable<OrderItem> { // Backend OrderItem döndürüyor -> Frontend OrderItem modeli ile değiştirildi
    return this.http.put<OrderItem>(`${this.apiUrl}/item/${orderItemId}/cancel-by-seller`, {}); // Frontend OrderItem modeli ile değiştirildi
  }
  
  // Admin'in bir sipariş kalemini iptal etmesi
  cancelOrderItemByAdmin(orderItemId: number): Observable<OrderItem> {
    // Yeni endpoint'i kullanıyoruz
    return this.http.put<OrderItem>(`${this.apiUrl}/item/${orderItemId}/cancel-by-admin`, {});
  }

  // Müşterinin bir sipariş için iade talebinde bulunması (updated)
  requestRefundForOrderItem(orderId: number, orderItemId: number, reason: string): Observable<OrderItem> {
    // Backend endpoint'i POST /api/orders/{orderId}/request-refund
    // Sipariş kalemi (orderItem) için iade talebini gönderir
    return this.http.post<OrderItem>(`${this.apiUrl}/${orderId}/request-refund`, {
      orderItemId: orderItemId,
      reason: reason
    });
  }

  // Compatibility için eklendi - aynı işlevi görür
  requestRefund(orderId: number, orderItemId: number, reason: string): Observable<OrderItem> {
    return this.requestRefundForOrderItem(orderId, orderItemId, reason);
  }
  
  // Satıcının bekleyen iade taleplerini getir
  getRefundRequestsBySeller(): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.apiUrl}/refund-requests/by-seller`);
  }
  
  // Satıcının iade talebini onaylaması
  approveRefundRequest(orderItemId: number): Observable<OrderItem> {
    return this.http.put<OrderItem>(`${this.apiUrl}/refund-requests/${orderItemId}/approve`, {});
  }
  
  // Satıcının iade talebini reddetmesi
  rejectRefundRequest(orderItemId: number, rejectionReason: string): Observable<OrderItem> {
    return this.http.put<OrderItem>(`${this.apiUrl}/refund-requests/${orderItemId}/reject`, null, {
      params: { rejectionReason }
    });
  }
  
  // Admin'in tüm siparişi iptal etmesi
  cancelOrderByAdmin(orderId: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/cancel`, null, {
      params: { orderId: orderId.toString() },
      responseType: 'text'
    });
  }
} 