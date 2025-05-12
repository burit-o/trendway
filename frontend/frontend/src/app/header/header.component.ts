import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Category } from '../models/category.model';
import { AuthService } from '../auth/services/auth.service';
import { CategoryService } from '../services/category.service';
import { CartService } from '../services/cart.service';
import { Cart } from '../models/cart.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  currentUser: any = null;
  cartItemCount = 0;
  categories: Category[] = [];
  isLoadingCategories = false;
  categoryError: string | null = null;
  cartError: string | null = null;

  constructor(
    private authService: AuthService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.currentUser = this.authService.currentUserValue;
      this.updateCartCount();
    }
    this.loadCategories();

    // Kullanıcı durumu değişikliklerini dinle (login/logout sonrası header'ı güncellemek için)
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      if (this.isLoggedIn) {
        this.updateCartCount();
      } else {
        this.cartItemCount = 0; // Çıkış yapıldığında sepet sayısını sıfırla
      }
    });

    // Sepet güncellemelerini dinle (başka bir yerden sepete ekleme/çıkarma olursa diye)
    this.cartService.cartUpdates$.subscribe(() => {
      if(this.isLoggedIn) {
        this.updateCartCount();
      }
    });
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryError = null;
    this.categoryService.getAllCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = categories;
        this.isLoadingCategories = false;
      },
      error: (error: Error) => {
        this.categoryError = 'Failed to load categories.';
        this.isLoadingCategories = false;
        console.error('Error loading categories in header:', error);
      }
    });
  }

  updateCartCount(): void {
    if (this.isLoggedIn && this.currentUser?.id) {
      this.cartService.getCart(this.currentUser.id).subscribe({
        next: (cart: Cart) => {
          this.cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          this.cartError = null;
        },
        error: (error: Error) => {
          this.cartError = 'Failed to update cart count in header.';
          console.error('Error updating cart count in header:', error);
        }
      });
    } else {
      this.cartItemCount = 0; // Eğer kullanıcı yoksa veya id yoksa sepeti sıfırla
    }
  }

  onSelectCategory(category?: Category): void {
    const categoryId = category ? category.id : null;
    // Kategoriye tıklandığında /products sayfasına yönlendir ve categoryId parametresini gönder
    this.router.navigate(['/products'], { queryParams: { categoryId: categoryId } });
  }

  logout(): void {
    this.authService.logout();
    // ngOnInit içindeki authService.currentUser aboneliği sayesinde
    // isLoggedIn, currentUser ve cartItemCount otomatik güncellenecektir.
    this.router.navigate(['/products']); // veya anasayfaya yönlendir
  }
} 