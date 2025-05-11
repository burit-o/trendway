import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // NgIf, NgFor gibi direktifler için
import { RouterModule, Router } from '@angular/router'; // RouterModule'ı ve Router'ı import et
import { AuthService } from '../auth/services/auth.service'; // AuthService için doğru yol
// import { Product } from '../models/product.model'; // Product modelini ileride import edeceğiz
// import { ProductService } from '../services/product.service'; // Product servisini ileride import edeceğiz

@Component({
  selector: 'app-seller-dashboard',
  standalone: true, // Angular 14+ için standalone component
  imports: [CommonModule, RouterModule], // RouterModule'ı imports dizisine ekle
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.scss'] // Stil dosyasını ekledik
})
export class SellerDashboardComponent implements OnInit {

  // products: Product[] = []; // Gerçek Product modeli kullanılacak
  products: any[] = []; // Şimdilik 'any' tipinde, daha sonra Product[] olacak
  isLoading = false; // Ürünler yüklenirken true olacak
  error: string | null = null; // Hata mesajlarını tutmak için

  constructor(
    private authService: AuthService, // AuthService'i enjekte et
    private router: Router // Router'ı enjekte et
  ) { }

  ngOnInit(): void {
    console.log('Seller Dashboard Layout Component Initialized');
    // this.loadSellerProducts(); // Component yüklendiğinde ürünleri çek
  }

  logout(): void {
    this.authService.logout(); // AuthService üzerinden çıkış yap
    this.router.navigate(['/auth/login']); // Login sayfasına yönlendir
    console.log('User logged out, navigating to login.');
  }

  // loadSellerProducts(): void {
  //   this.isLoading = true;
  //   this.error = null;
  //   const currentUserId = this.authService.currentUserValue?.id;

  //   if (!currentUserId) {
  //     this.error = 'User not logged in or user ID not found.';
  //     this.isLoading = false;
  //     return;
  //   }

  //   // TODO: Backend'de satıcının ürünlerini getiren bir endpoint olmalı.
  //   // Örnek: this.productService.getProductsBySellerId(currentUserId).subscribe({
  //   //   next: (data) => {
  //   //     this.products = data;
  //   //     this.isLoading = false;
  //   //   },
  //   //   error: (err) => {
  //   //     console.error('Error loading seller products:', err);
  //   //     this.error = 'Failed to load products. Please try again later.';
  //   //     this.isLoading = false;
  //   //   }
  //   // });

  //   // Şimdilik örnek verilerle dolduralım (test için)
  //   setTimeout(() => {
  //     this.products = [
  //       { id: 1, name: 'My Awesome T-Shirt', category: 'Apparel', price: 29.99, status: 'Active' },
  //       { id: 2, name: 'Handcrafted Mug', category: 'Home Goods', price: 15.50, status: 'Inactive' },
  //       { id: 3, name: 'Organic Coffee Beans', category: 'Groceries', price: 22.00, status: 'Active' }
  //     ];
  //     this.isLoading = false;
  //   }, 1500);
  // }

  // editProduct(productId: number): void {
  //   console.log('Edit product with ID:', productId);
  //   // TODO: Ürün düzenleme sayfasına/modalına yönlendirme veya açma
  // }

  // toggleProductStatus(product: any): void {
  //   console.log('Toggle status for product:', product.name);
  //   // TODO: Ürünün aktif/pasif durumunu değiştirecek servis çağrısı
  //   // product.status = product.status === 'Active' ? 'Inactive' : 'Active'; // Örneğin basit bir toggle
  // }

  // addNewProduct(): void {
  //   console.log('Add new product clicked');
  //   // TODO: Yeni ürün ekleme sayfasına/modalına yönlendirme
  // }
} 