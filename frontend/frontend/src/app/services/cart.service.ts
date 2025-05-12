import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cart } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:8080/api/cart';

  // Sepet güncellemeleri için Subject ve Observable
  private _cartUpdates = new Subject<void>();
  public cartUpdates$ = this._cartUpdates.asObservable();

  constructor(private http: HttpClient) { }

  getCart(userId: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/${userId}`);
  }

  addToCart(userId: number, productId: number, quantity: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/add`, null, {
      params: {
        userId: userId.toString(),
        productId: productId.toString(),
        quantity: quantity.toString()
      }
    }).pipe(
      tap(() => {
        console.log('Cart updated (add), notifying subscribers...');
        this._cartUpdates.next(); // Başarılı ekleme sonrası Subject'i tetikle
      })
    );
  }

  removeFromCart(userId: number, productId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/remove`, {
      params: {
        userId: userId.toString(),
        productId: productId.toString()
      }
    }).pipe(
      tap(() => {
        console.log('Cart updated (remove), notifying subscribers...');
        this._cartUpdates.next(); // Başarılı silme sonrası Subject'i tetikle
      })
    );
  }

  clearCart(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clear/${userId}`).pipe(
      tap(() => {
        console.log('Cart updated (clear), notifying subscribers...');
        this._cartUpdates.next(); // Başarılı temizleme sonrası Subject'i tetikle
      })
    );
  }

  // Dışarıdan tetikleme için (belki login sonrası vb.)
  notifyCartUpdate() {
    console.log('Cart update notified externally...');
    this._cartUpdates.next();
  }
}
