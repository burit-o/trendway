import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/products';
  private adminApiUrl = 'http://localhost:8080/api/admin/products';

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

  // Yeni ürün ekle (Auth gerektirir, backend'de korunmalı)
  // productData artık category nesnesi içeriyor.
  addProduct(productData: Partial<Product> & { category: { id: number } }, sellerId: number): Observable<Product> {
    // sellerId'nin null veya undefined olmadığından emin olalım
    if (!sellerId) {
        throw new Error("Seller ID is required to add a product.");
    }
    // productData'nın temel alanlarının ve category.id'nin varlığını kontrol edebiliriz
    if (!productData || !productData.name || !productData.price || !productData.description || !productData.category || !productData.category.id) {
        throw new Error("Product data (name, price, description, category.id) is required.");
    }
    
    // URL doğru: /add/{sellerId}
    return this.http.post<Product>(`${this.apiUrl}/add/${sellerId}`, productData);
  }

  // Ürünü güncelle (Auth gerektirir, backend'de korunmalı)
  updateProduct(productId: number, productData: Partial<Product>): Observable<Product> {
    // Backend endpoint'i PUT /api/products/{productId} gibi olmalı
    // Bu endpoint'in backend'de uygun şekilde korunuyor olması gerekir.
    return this.http.put<Product>(`${this.apiUrl}/${productId}`, productData);
  }

  // Seller: Ürün silme metodu (Backend Principal kullanıyor, burası eski kalabilir veya güncellenebilir)
  deleteProductBySeller(productId: number): Observable<string> {
    // Backend bu endpointte Principal bekliyor, frontend'den sellerId göndermeye gerek yok.
    return this.http.delete<string>(`${this.apiUrl}/delete/${productId}`); // Body silebiliriz?
  }

  // Admin: Tüm ürünleri getir (aktif/inaktif dahil)
  getAllProductsForAdmin(): Observable<Product[]> {
    // Silinmemiş tüm ürünleri getiren yeni endpoint'i kullanıyoruz
    return this.http.get<Product[]>(`${this.apiUrl}/not-deleted`);
  }

  // Admin: Ürünü aktifleştir
  activateProduct(productId: number): Observable<any> {
    // Normal update endpoint'ini kullanarak active=true değerini göndereceğiz
    // updateProductDetails metodunu zaten güncelledik, hem ADMIN hem SELLER erişebilir
    return this.http.put<Product>(`${this.apiUrl}/${productId}`, { active: true });
  }

  // Admin: Ürünü deaktifleştir
  deactivateProduct(productId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/deactivate/${productId}`, {}, { responseType: 'text' });
  }

  // Admin: Ürün sil (HARD DELETE, sadece admin)
  deleteProductByAdmin(productId: number): Observable<any> {
    // Backend'deki endpoint PUT /api/products/delete/{id} şeklinde
    // Bu metodun adı yanıltıcı olabilir, belki soft delete'tir?
    // Şimdilik backend'deki URL'ye göre PUT olarak bırakıyorum
    return this.http.put(`${this.apiUrl}/delete/${productId}`, {}, { responseType: 'text' }); 
    // Eğer gerçekten DELETE ise:
    // return this.http.delete(`${this.apiUrl}/delete-admin/${productId}`, { responseType: 'text' }); // Backend endpoint farklı olmalı
  }
}
