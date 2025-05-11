import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, ReviewRequest } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:8080/api'; // Ana API URL'niz

  constructor(private http: HttpClient) { }

  // Bir ürüne ait tüm yorumları getir
  getReviewsByProductId(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews/product/${productId}`);
  }

  // Yeni yorum ekle (giriş yapmış kullanıcılar için)
  addReview(productId: number, reviewData: ReviewRequest): Observable<Review> {
    // Bu endpoint /api/reviews veya /api/products/{productId}/reviews şeklinde olabilir
    // Backend'inize göre düzenleyin. Auth token interceptor tarafından eklenecektir.
    return this.http.post<Review>(`${this.apiUrl}/reviews`, reviewData); 
    // Veya eğer productId URL'de ise:
    // return this.http.post<Review>(`${this.apiUrl}/products/${productId}/reviews`, reviewData);
  }

  // TODO: Kullanıcının bir ürüne daha önce yorum yapıp yapmadığını kontrol eden bir servis eklenebilir.
  // TODO: Yorum silme/güncelleme (admin veya kullanıcı kendi yorumuysa) servisleri eklenebilir.
} 