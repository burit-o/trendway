import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { User } from '../auth/models/auth.model';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`)
      .pipe(
        catchError(this.handleError)
      );
  }

  banUser(userId: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/ban`, {}, { responseType: 'text' })
      .pipe(
        catchError(this.handleError)
      );
  }

  unbanUser(userId: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/unban`, {}, { responseType: 'text' })
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/admin/users/${userId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user/me`);
  }

  requestSellerStatus(): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/request-seller-status`, {}, { responseType: 'text' });
  }

  // --- Admin Specific Methods ---

  getSellerRequests(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/seller-requests`)
      .pipe(catchError(this.handleError));
  }

  approveSellerRequest(userId: number): Observable<string> {
    // Note: This endpoint is in UserController, adjust if moved later
    return this.http.put(`${this.apiUrl}/user/approve-seller-request/${userId}`, {}, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  rejectSellerRequest(userId: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/admin/reject-seller-request/${userId}`, {}, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 403) {
      console.error('Access denied. Make sure you have the ADMIN role to access this resource.');
      return throwError(() => new Error('You do not have permission to access this resource. Admin role required.'));
    }
    
    let errorMsg = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMsg = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMsg = `Error Code: ${error.status}, Message: ${error.message}`;
    }
    console.error(errorMsg);
    return throwError(() => new Error('An unexpected error occurred. Please try again later.'));
  }
}
