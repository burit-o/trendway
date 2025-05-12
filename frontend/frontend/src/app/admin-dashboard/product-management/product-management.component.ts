import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss']
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  error = '';
  isAdmin = false;
  actionInProgress = false;

  constructor(
    private productService: ProductService,
    public authService: AuthService,
    private router: Router
  ) {
    // Admin yetkisi kontrolü
    this.isAdmin = this.authService.hasRole('ADMIN');
    if (!this.isAdmin) {
      console.warn('Unauthorized access attempt to Product Management component');
      this.error = 'You do not have permission to access this page. Admin role required.';
      setTimeout(() => this.router.navigate(['/products']), 3000);
    }
  }

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadProducts();
    }
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAllProductsForAdmin().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.error = error.message || 'Failed to load products. Please try again later.';
        this.loading = false;
      }
    });
  }

  toggleProductStatus(product: Product): void {
    this.actionInProgress = true;
    
    if (product.active) {
      this.productService.deactivateProduct(product.id).subscribe({
        next: () => {
          product.active = false;
          console.log(`Product ${product.id} deactivated successfully`);
          this.actionInProgress = false;
        },
        error: (error) => {
          console.error(`Error deactivating product ${product.id}:`, error);
          this.error = `Failed to deactivate product ${product.name}. Please try again.`;
          this.actionInProgress = false;
        }
      });
    } else {
      this.productService.activateProduct(product.id).subscribe({
        next: () => {
          product.active = true;
          console.log(`Product ${product.id} activated successfully`);
          this.actionInProgress = false;
        },
        error: (error) => {
          console.error(`Error activating product ${product.id}:`, error);
          this.error = `Failed to activate product ${product.name}. Please try again.`;
          this.actionInProgress = false;
        }
      });
    }
  }

  refreshProducts(): void {
    this.loadProducts();
  }

  getStatusClass(product: Product): string {
    return product.active ? 'bg-success' : 'bg-danger';
  }

  getStatusText(product: Product): string {
    return product.active ? 'Active' : 'Inactive';
  }

  getActionButtonText(product: Product): string {
    return product.active ? 'Deactivate' : 'Activate';
  }

  getActionButtonClass(product: Product): string {
    return product.active ? 'btn-outline-danger' : 'btn-outline-success';
  }
}
