import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';

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
  
  // TODO: Gelecekte sipariş oluşturma, iptal etme gibi fonksiyonlar eklenebilir.
} 