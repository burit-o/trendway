import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Address } from '../models/address.model';
import { AuthService } from '../auth/services/auth.service'; // Kullanıcı ID'si için

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = 'http://localhost:8080/api/addresses'; // Backend API URL'nizi buraya girin

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getCurrentUserId(): number | null {
    const currentUser = this.authService.currentUserValue;
    return currentUser ? currentUser.id : null;
  }

  // Kullanıcının tüm adreslerini getir
  getAddressesByUserId(userId: number): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Yeni adres ekle
  addAddress(address: Omit<Address, 'id' | 'userId'>): Observable<Address> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not logged in'); // veya Observable.throwError
    }
    const newAddress: Partial<Address> = { ...address, userId };
    return this.http.post<Address>(this.apiUrl, newAddress);
  }

  // Adresi güncelle
  updateAddress(addressId: number, address: Partial<Omit<Address, 'id' | 'userId'>>): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/${addressId}`, address);
  }

  // Adresi sil
  deleteAddress(addressId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${addressId}`);
  }
} 