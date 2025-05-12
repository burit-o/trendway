import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model'; // Product modelini import et
import { ProductService } from '../../services/product.service'; // ProductService'i import et
import { AuthService } from '../../auth/services/auth.service'; // AuthService'i import et
import { RouterModule } from '@angular/router'; // Gerekirse routerLink için
import { EditProductModalComponent } from '../edit-product-modal/edit-product-modal.component'; // Edit modal bileşenini import et
import { AddProductModalComponent } from '../add-product-modal/add-product-modal.component'; // Add modal bileşenini import et

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, RouterModule, EditProductModalComponent, AddProductModalComponent], // AddProductModalComponent eklendi
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
  isAddModalVisible = false; // Yeni modal için görünürlük bayrağı

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
    // TODO: Yeni ürün ekleme modal/sayfa yönlendirmesi - KALDIRILDI
    this.isAddModalVisible = true; // Modal'ı görünür yap
  }

  openEditModal(product: Product): void {
    console.log('openEditModal called for product:', product);
    this.selectedProductForEdit = { ...product };
    this.isEditModalVisible = true;
    console.log('isEditModalVisible set to true. selectedProductForEdit:', this.selectedProductForEdit);
  }

  handleCloseEditModal(): void {
    console.log('Closing edit modal');
    this.isEditModalVisible = false;
    this.selectedProductForEdit = null;
  }

  handleCloseAddModal(): void {
    console.log('Closing add modal');
    this.isAddModalVisible = false;
  }

  handleSaveNewProduct(eventData: Partial<Product> & { categoryId?: number }): void {
    console.log('[SellerProducts] handleSaveNewProduct event received with data:', eventData);
    
    // Gerekli alanların kontrolü
    if (!this.currentUserId) {
      console.error('Cannot add product: Seller ID is missing');
      this.error = 'Cannot add product: Seller ID is missing.';
      setTimeout(() => this.error = null, 3000);
      return;
    }
    if (!eventData.categoryId) {
        console.error('Cannot add product: Category ID is missing from event data');
        this.error = 'Cannot add product: Category ID is missing. Please select a category.';
         setTimeout(() => this.error = null, 3000);
        return;
    }
    if (!eventData.name || !eventData.description || eventData.price == null || eventData.stock == null) {
      console.error('Cannot add product: Missing required fields (name, description, price, stock)');
      this.error = 'Cannot add product: Please fill all required fields.';
       setTimeout(() => this.error = null, 3000);
      return;
    }

    // ProductService.addProduct'a göndereceğimiz Product nesnesini oluşturalım.
    // Backend Product nesnesi içinde category nesnesi bekliyor.
    // Service de artık 2 parametre (productData, sellerId) bekliyor.
    const productToSend: Partial<Product> & { category: { id: number } } = {
      name: eventData.name,
      description: eventData.description,
      price: eventData.price,
      stock: eventData.stock,
      imageUrls: eventData.imageUrls || [],
      active: true,
      category: { id: eventData.categoryId! } // categoryId'nin undefined olmadığını varsayıyoruz (yukarıda kontrol edildi)
    };

    // addProduct servisi artık 2 parametre bekliyor: (payload, sellerId)
    this.productService.addProduct(productToSend, this.currentUserId).subscribe({
        next: (newProduct) => {
            console.log('Product added successfully:', newProduct);
            this.products.push(newProduct); // Yeni ürünü listeye ekle
            this.handleCloseAddModal(); // Modalı kapat
            this.error = null; // Hata mesajını temizle
        },
        error: (err) => {
            console.error('Error adding product:', err);
            this.error = `Failed to add product: ${err.error?.message || err.message || 'Unknown error'}`;
            // Hata mesajını bir süre sonra temizle (opsiyonel)
            // setTimeout(() => this.error = null, 5000);
        }
    });
  }

  toggleProductStatus(product: Product): void {
    console.log('Toggle status for product:', product.name, 'Current active status:', product.active);
    
    const newStatus = !product.active;
    const productId = product.id;
    
    if (!productId) {
      console.error('Cannot toggle status: Product ID is missing');
      return;
    }

    // Optimize ederek kullanıcı deneyimini iyileştiriyoruz - Önce UI'ı güncelliyoruz
    product.active = newStatus; // UI'da hemen değişiklik göster

    // Sonra backende bildir
    this.productService.updateProduct(productId, { active: newStatus }).subscribe({
      next: () => {
        console.log(`Product status successfully changed to ${newStatus ? 'active' : 'inactive'}`);
        // UI zaten güncellendiği için ek bir işlem yapmaya gerek yok
      },
      error: (err) => {
        console.error('Error updating product status:', err);
        product.active = !newStatus; // Hata durumunda original duruma geri döndür
        
        // Kullanıcıya bir hata mesajı gösterebiliriz (opsiyonel)
        this.error = 'Failed to update product status. Please try again.';
        setTimeout(() => this.error = null, 3000); // 3 saniye sonra hata mesajını kaldır
      }
    });
  }

  saveProduct(productData: Partial<Product>): void {
    console.log('[SellerProducts] saveProduct event received with data:', productData);
    
    if (!productData.id) {
      console.error('Cannot update product: ID is missing');
      return;
    }
    
    this.productService.updateProduct(productData.id, productData).subscribe({
      next: (updatedProduct) => {
        console.log('Product updated successfully:', updatedProduct);
        
        // Ürün listesini güncelle
        const index = this.products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          this.products[index] = { ...this.products[index], ...updatedProduct };
        }
        
        // Modalı kapat
        this.handleCloseEditModal();
      },
      error: (err) => {
        console.error('Error updating product:', err);
        // Kullanıcıya hata mesajı gösterebiliriz
        this.error = 'Failed to update product. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }
} 