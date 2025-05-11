import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model'; // Product modelini import et
import { ProductService } from '../../services/product.service'; // ProductService'i import et
import { AuthService } from '../../auth/services/auth.service'; // AuthService'i import et
import { RouterModule } from '@angular/router'; // Gerekirse routerLink için

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, RouterModule], // RouterModule eklendi (opsiyonel, butonlar için)
  templateUrl: './seller-products.component.html',
  // styleUrls: ['./seller-products.component.scss']
})
export class SellerProductsComponent implements OnInit {
  products: Product[] = []; // Artık Product tipini kullanıyoruz
  isLoading = false;
  error: string | null = null;
  currentUserId: number | null = null;
  selectedProductForEdit: Product | null = null;
  isEditModalVisible = false;

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('Seller Products Component Initialized');
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.currentUserId = currentUser.id;
      this.loadSellerProducts();
    } else {
      this.error = "User not logged in or user ID is missing. Cannot load products.";
      console.error(this.error);
    }
  }

  loadSellerProducts(): void {
    if (!this.currentUserId) {
      this.error = 'Cannot load products without a seller ID.';
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.productService.getProductsBySellerId(this.currentUserId).subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
        if (data.length === 0) {
          console.log("No products found for this seller.");
        }
      },
      error: (err) => {
        console.error('Error loading seller products:', err);
        this.error = 'Failed to load products. Please try again later.';
        if (err.status === 404) {
            this.error = 'No products found for your account, or there was an issue fetching them.';
        } else if (err.status === 403) {
            this.error = 'You are not authorized to view these products.';
        }
        this.isLoading = false;
      }
    });
  }

  getFirstImageUrl(product: Product): string {
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls[0];
    }
    return 'assets/placeholder.jpg'; // Veya varsayılan bir placeholder yolu
  }

  addNewProduct(): void {
    console.log('Add new product clicked');
    // TODO: Yeni ürün ekleme modal/sayfa yönlendirmesi
  }

  openEditModal(product: Product): void {
    console.log('openEditModal called for product:', product);
    this.selectedProductForEdit = { ...product };
    this.isEditModalVisible = true;
    console.log('isEditModalVisible set to true. selectedProductForEdit:', this.selectedProductForEdit);
  }

  handleCloseEditModal(): void {
    // ... existing code ...
  }

  toggleProductStatus(product: Product): void {
    console.log('Toggle status for product:', product.name, 'Current active status:', product.active);
    // TODO: Ürünün aktif/pasif durumunu backend'e bildirme ve UI'ı güncelleme
    // Örnek: product.active = !product.active; // Bu sadece UI'da geçici değişiklik yapar
  }
} 