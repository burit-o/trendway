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

  // Sipariş kaleminin durumunu güncelle (genel amaçlı)
  updateOrderItemStatus(orderItemId: number, status: string): Observable<any> { // Dönen tip backend'e göre ayarlanabilir, şimdilik any
    return this.http.put(`${this.apiUrl}/update-item-status`, null, {
      params: {
        orderItemId: orderItemId.toString(),
        status: status
      }
    });
  }

  // Satıcının bir sipariş kalemini iptal etmesi
  cancelOrderItemBySeller(orderItemId: number): Observable<OrderItem> { // Backend OrderItem döndürüyor -> Frontend OrderItem modeli ile değiştirildi
    return this.http.put<OrderItem>(`${this.apiUrl}/item/${orderItemId}/cancel-by-seller`, {}); // Frontend OrderItem modeli ile değiştirildi
  }
  
  // TODO: Gelecekte sipariş oluşturma, iptal etme gibi fonksiyonlar eklenebilir.
} 