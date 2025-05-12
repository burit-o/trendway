import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError, of } from 'rxjs';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models/auth.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  private getUserFromStorage(): User | null {
    if (!this.isBrowser) return null;
    const userString = localStorage.getItem('currentUser');
    return userString ? JSON.parse(userString) : null;
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginRequest)
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            localStorage.setItem('token', response.token);

            const user: User = {
              id: response.userId,
              firstName: response.firstName,
              lastName: response.lastName,
              email: loginRequest.email,
              role: response.role
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerRequest)
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            localStorage.setItem('token', response.token);

            const user: User = {
              id: response.userId,
              firstName: registerRequest.firstName,
              lastName: registerRequest.lastName,
              email: registerRequest.email,
              role: response.role
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      this.currentUserSubject.next(null);
    }
  }

  isLoggedIn(): boolean {
    return this.isBrowser ? !!localStorage.getItem('token') : false;
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  getRefreshToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/refresh-token`, {})
      .pipe(
        tap(response => {
          if (this.isBrowser && response.token) {
            localStorage.setItem('token', response.token);
          }
        }),
        catchError(error => {
          console.error('Token refresh error:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  updateUser(userId: number, userData: Partial<User>): Observable<User> {
    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...userData };
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      this.currentUserSubject.next(updatedUser);
      return of(updatedUser);
    } else {
      return throwError(() => new Error('User not found or ID mismatch'));
    }
  }

  setCurrentUser(user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  changePassword(payload: { currentPassword: string, newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/change-password`, payload, { responseType: 'text' })
      .pipe(
        tap(response => {
          console.log('Password change response:', response);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Password change error:', error);
          return throwError(() => error);
        })
      );
  }

  hasRole(requiredRole: string): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser) return false;
    
    // Check the role with and without 'ROLE_' prefix
    const userRole = currentUser.role;
    const userRoleWithoutPrefix = userRole.startsWith('ROLE_') ? userRole.substring(5) : userRole;
    const requiredRoleWithPrefix = requiredRole.startsWith('ROLE_') ? requiredRole : 'ROLE_' + requiredRole;
    
    // Special case for USER/CUSTOMER role
    if (requiredRole === 'CUSTOMER' && (userRole === 'USER' || userRole === 'ROLE_USER')) {
      return true;
    }
    
    return userRole === requiredRole || 
           userRole === requiredRoleWithPrefix || 
           userRoleWithoutPrefix === requiredRole;
  }
}
