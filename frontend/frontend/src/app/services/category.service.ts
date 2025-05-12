import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { Category } from '../models/category.model';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:8080/api/categories';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }
  
  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/public`);
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  addCategory(category: Category): Observable<Category> {
    console.log('Sending request to add category:', category);
    
    // Normal HTTP request yerine fetch API kullanarak deniyoruz
    return from(this.addCategoryWithFetch(category));
  }
  
  // Fetch API ile kategori ekleme
  private async addCategoryWithFetch(category: Category): Promise<Category> {
    const token = this.authService.getToken();
    
    console.log('Using fetch API with token:', token);
    
    const response = await fetch(`${this.apiUrl}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(category)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch error:', response.status, errorText);
      throw new Error(`Failed to add category: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  }

  deleteCategory(id: number): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    // ResponseType 'text' olarak ayarlanıyor, böylece JSON parsing hatası olmayacak
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { 
      headers,
      responseType: 'text' 
    });
  }
}
