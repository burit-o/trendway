import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { Cart } from '../models/cart.model';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { AuthService } from '../auth/services/auth.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  isLoggedIn = false;
  cartItemCount = 0;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy = 'price_asc';

  // Loading states
  isLoading = false;
  isLoadingCategories = false;
  isAddingToCart = false;

  // Error states
  error: string | null = null;
  categoryError: string | null = null;
  cartError: string | null = null;

  // Image loading states
  loadingImages: { [key: number]: boolean } = {};

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.isLoggedIn = this.authService.isLoggedIn();
    this.updateCartCount();

    // URL'deki query parametrelerini dinle (kategori değişimi için)
    this.route.queryParams.subscribe(params => {
      const categoryId = params['categoryId'];
      if (categoryId) {
        this.loadProducts(+categoryId);
      } else {
        this.loadProducts();
      }
    });
  }

  initializeLoadingImages(products: Product[]): void {
    products.forEach(product => {
      this.loadingImages[product.id] = true;
    });
  }

  loadProducts(categoryId?: number): void {
    this.isLoading = true;
    this.error = null;

    const productsObservable = categoryId 
      ? this.productService.getProductsByCategory(categoryId)
      : this.productService.getAllProducts();

    productsObservable.subscribe({
      next: (products: Product[]) => {
        this.products = products;
        this.filteredProducts = [...products];
        this.initializeLoadingImages(products);
        this.applyFiltersAndSorting();
        this.isLoading = false;
      },
      error: (error: Error) => {
        this.error = categoryId ? 'Failed to filter products by category.' : 'Failed to load products. Please try again.';
        this.isLoading = false;
        console.error(categoryId ? 'Error filtering by category:' : 'Error loading products:', error);
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
        console.error('Error loading categories:', error);
      }
    });
  }

  updateCartCount(): void {
    if (this.isLoggedIn) {
      const userId = this.authService.currentUserValue?.id;
      if (userId) {
        this.cartService.getCart(userId).subscribe({
          next: (cart: Cart) => {
            this.cartItemCount = cart.items.length;
            this.cartError = null;
          },
          error: (error: Error) => {
            this.cartError = 'Failed to update cart.';
            console.error('Error updating cart count:', error);
          }
        });
      }
    }
  }

  onSelectCategory(category?: Category): void {
    const categoryId = category ? category.id : null;
    this.router.navigate(['/products'], { queryParams: { categoryId: categoryId } });
    this.minPrice = null;
    this.maxPrice = null;
  }

  applyFiltersAndSorting(): void {
    let tempProducts = [...this.products];

    const categoryIdFromUrl = this.route.snapshot.queryParams['categoryId'];
    if (categoryIdFromUrl) {
      tempProducts = tempProducts.filter(p => p.category?.id === +categoryIdFromUrl);
    }

    if (this.minPrice !== null || this.maxPrice !== null) {
      tempProducts = tempProducts.filter(product => {
        const price = product.price;
        const min = this.minPrice === null ? -Infinity : this.minPrice;
        const max = this.maxPrice === null ? Infinity : this.maxPrice;
        return price >= min && price <= max;
      });
  }

    switch (this.sortBy) {
      case 'price_asc':
        tempProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        tempProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        tempProducts.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
        break;
    }
    this.filteredProducts = tempProducts;
  }

  applyPriceFilter(): void {
    this.applyFiltersAndSorting();
  }

  applySorting(): void {
    this.applyFiltersAndSorting();
  }

  addToCart(product: Product): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/auth/login'], { 
        queryParams: { 
          returnUrl: this.router.routerState.snapshot.url,
          addToCartProductId: product.id, 
          quantity: 1
        }
      });
      return;
    }

    const userId = this.authService.currentUserValue?.id;
    if (userId) {
      this.isAddingToCart = true;
      this.cartError = null;
      this.cartService.addToCart(userId, product.id, 1).subscribe({
        next: () => {
          this.updateCartCount();
          this.isAddingToCart = false;
        },
        error: (error: Error) => {
          this.cartError = 'Failed to add item to cart.';
          this.isAddingToCart = false;
          console.error('Error adding to cart:', error);
        }
      });
    }
  }

  handleImageLoad(event: Event, productId: number): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.classList.remove('loading');
      this.loadingImages[productId] = false;
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      console.warn(`Failed to load image: ${img.src}. Placeholder image is also missing or not configured.`);
      img.alt = 'Image not available';
      img.classList.remove('loading');
    }
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.cartItemCount = 0;
    this.router.navigate(['/products']);
  }

  retry(): void {
    const categoryIdFromUrl = this.route.snapshot.queryParams['categoryId'];
    if (categoryIdFromUrl) {
      this.loadProducts(+categoryIdFromUrl);
    } else {
    this.loadProducts();
    }
  }
}
