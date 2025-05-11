import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) { }
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/public/active`);
  }
  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/public/category/${categoryId}`);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // Satıcı ID'sine göre ürünleri getir (Auth gerektirir, backend'de korunmalı)
  getProductsBySellerId(sellerId: number): Observable<Product[]> {
    // Backend endpoint'i /api/products/seller/{sellerId} gibi olmalı
    // Bu endpoint'in backend'de uygun şekilde korunuyor olması gerekir.
    return this.http.get<Product[]>(`${this.apiUrl}/seller/${sellerId}`);
  }

  // Ürünü güncelle (Auth gerektirir, backend'de korunmalı)
  updateProduct(productId: number, productData: Partial<Product>): Observable<Product> {
    // Backend endpoint'i PUT /api/products/{productId} gibi olmalı
    // Bu endpoint'in backend'de uygun şekilde korunuyor olması gerekir.
    return this.http.put<Product>(`${this.apiUrl}/${productId}`, productData);
  }
}
