import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // NgIf, NgFor gibi direktifler için
import { RouterModule, Router } from '@angular/router'; // RouterModule'ı ve Router'ı import et
import { AuthService } from '../auth/services/auth.service'; // AuthService için doğru yol
import { OrderService } from '../services/order.service'; // OrderService'i iade talepleri için import et
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HeaderComponent } from '../header/header.component'; // HeaderComponent import edildi
// import { Product } from '../models/product.model'; // Product modelini ileride import edeceğiz
// import { ProductService } from '../services/product.service'; // Product servisini ileride import edeceğiz

@Component({
  selector: 'app-seller-dashboard',
  standalone: true, // Angular 14+ için standalone component
  imports: [
    CommonModule,
    RouterModule, // RouterModule imports'a eklendi
    HeaderComponent // HeaderComponent imports'a eklendi
  ],
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.scss'] // Stil dosyasını ekledik
})
export class SellerDashboardComponent implements OnInit, OnDestroy {

  // products: Product[] = []; // Gerçek Product modeli kullanılacak
  products: any[] = []; // Şimdilik 'any' tipinde, daha sonra Product[] olacak
  isLoading = false; // Ürünler yüklenirken true olacak
  error: string | null = null; // Hata mesajlarını tutmak için
  refundCount: number = 0; // Bekleyen iade talepleri sayısı
  sellerName: string | null = null; // Satıcı adı
  private refundCheckSubscription?: Subscription; // İade taleplerini periyodik kontrol için

  constructor(
    private authService: AuthService, // AuthService'i enjekte et
    private orderService: OrderService, // OrderService'i enjekte et
    private router: Router // Router'ı enjekte et
  ) { }

  ngOnInit(): void {
    console.log('Seller Dashboard Layout Component Initialized');
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.sellerName = currentUser.firstName + ' ' + currentUser.lastName; // Veya sadece firstName
      this.loadRefundRequestCount(); // Geri ödeme talebi sayısını yükle (sellerId parametresi kaldırıldı)
      
      // Her 60 saniyede bir yeni iade taleplerini kontrol et
      this.refundCheckSubscription = interval(60000).pipe(
        // switchMap(() => this.orderService.getRefundRequestsBySeller(currentUser.id)) // eski hali
        switchMap(() => this.orderService.getRefundRequestsBySeller()) // sellerId parametresi kaldırıldı
      ).subscribe(requests => {
        // Sadece PENDING durumundaki talepleri say
        this.refundCount = requests.filter(req => req.status === 'PENDING').length;
      });
    } else {
      // Kullanıcı yoksa login sayfasına yönlendir
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
    }
  }
  
  ngOnDestroy(): void {
    if (this.refundCheckSubscription) {
      this.refundCheckSubscription.unsubscribe();
    }
  }

  loadRefundRequestCount(): void { // sellerId parametresi kaldırıldı
    this.orderService.getRefundRequestsBySeller().subscribe({ // sellerId parametresi kaldırıldı
      next: (refundRequests) => {
        // Sadece PENDING durumundaki talepleri say
        this.refundCount = refundRequests.filter(req => req.status === 'PENDING').length;
      },
      error: (err) => {
        console.error('Error loading refund request count:', err);
        this.refundCount = 0; // Hata durumunda 0 göster
      }
    });
  }

  logout(): void {
    this.authService.logout(); // AuthService üzerinden çıkış yap
    this.router.navigate(['/products']); // /products sayfasına yönlendir
    console.log('User logged out, navigating to products.');
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