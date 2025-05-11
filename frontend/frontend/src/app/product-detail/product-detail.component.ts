import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { Review } from '../models/review.model';
import { ReviewService } from '../services/review.service';
import { OrderService } from '../services/order.service';
import { AuthService } from '../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  reviews: Review[] = [];
  isLoadingReviews = false;
  reviewError: string | null = null;
  hasPurchasedProduct: boolean = false;
  isLoadingPurchaseStatus: boolean = false;
  
  reviewForm: FormGroup;
  isSubmittingReview = false;
  submitReviewError: string | null = null;
  submitReviewSuccess: string | null = null;
  isLoggedIn = false;
  currentUserId: number | null = null;
  public reviewFormSubmitted = false;

  quantity: number = 1;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private reviewService: ReviewService,
    private orderService: OrderService,
    private authService: AuthService,
    private fb: FormBuilder,
    public router: Router,
    private cartService: CartService
  ) {
    this.reviewForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentUserId = this.authService.currentUserValue?.id || null;

    this.route.paramMap.pipe(
      tap(() => {
        this.isLoading = true;
        this.isLoadingReviews = true;
        this.isLoadingPurchaseStatus = true;
        this.hasPurchasedProduct = false;
        this.error = null;
        this.reviewError = null;
        this.quantity = 1;
        this.product = null;
        this.reviews = [];
        this.reviewForm.reset();
        this.submitReviewError = null;
        this.submitReviewSuccess = null;
        this.reviewFormSubmitted = false;
      }),
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          const productId = +id;
          this.loadProductDetails(productId);
          this.loadReviews(productId);
          if (this.isLoggedIn) {
            this.checkIfUserPurchased(productId);
          } else {
            this.isLoadingPurchaseStatus = false;
          }
          this.reviewFormSubmitted = false;
          return of(productId);
        }
        this.error = 'Product ID not found.';
        this.isLoading = false;
        this.isLoadingReviews = false;
        return of(null);
      })
    ).subscribe();
  }

  loadProductDetails(productId: number): void {
    this.productService.getProductById(productId).subscribe({
      next: (data) => {
        this.product = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching product details:', err);
        this.error = 'Failed to load product details.';
        if (err.status === 404) this.error = 'Product not found.';
        this.isLoading = false;
      }
    });
  }

  loadReviews(productId: number): void {
    this.reviewService.getReviewsByProductId(productId).subscribe({
      next: (data) => {
        this.reviews = data.sort((a,b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());
        this.isLoadingReviews = false;
      },
      error: (err) => {
        console.error('Error fetching reviews:', err);
        this.reviewError = 'Failed to load reviews.';
        this.isLoadingReviews = false;
      }
    });
  }

  checkIfUserPurchased(productId: number): void {
    this.isLoadingPurchaseStatus = true;
    this.orderService.checkIfUserPurchasedProduct(productId).subscribe({
      next: (hasPurchased) => {
        this.hasPurchasedProduct = hasPurchased;
        this.isLoadingPurchaseStatus = false;
      },
      error: (err) => {
        console.error('Error checking purchase status:', err);
        this.hasPurchasedProduct = false;
        this.isLoadingPurchaseStatus = false;
      }
    });
  }

  submitReview(): void {
    this.reviewFormSubmitted = true;
    if (!this.product || this.reviewForm.invalid || !this.isLoggedIn || !this.hasPurchasedProduct) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.isSubmittingReview = true;
    this.submitReviewError = null;
    this.submitReviewSuccess = null;

    const reviewData = { 
      productId: this.product.id,
      ...this.reviewForm.value 
    };

    this.reviewService.addReview(this.product.id, reviewData).subscribe({
      next: (newReview) => {
        this.isSubmittingReview = false;
        this.submitReviewSuccess = 'Review submitted successfully! Waiting for approval.';
        this.reviews.unshift(newReview);
        this.reviewForm.reset();
        this.reviewFormSubmitted = false;
        setTimeout(() => this.submitReviewSuccess = null, 4000);
      },
      error: (err) => {
        this.isSubmittingReview = false;
        this.submitReviewError = err.error?.message || 'Failed to submit review.';
        console.error('Error submitting review:', err);
        setTimeout(() => this.submitReviewError = null, 5000);
      }
    });
  }

  get rf() { return this.reviewForm.controls; }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onQuantityChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let value = parseInt(inputElement.value, 10);

    if (isNaN(value) || value < 1) {
      value = 1;
    }
    if (this.product && value > this.product.stock) {
      value = this.product.stock;
    }
    this.quantity = value;
    inputElement.value = this.quantity.toString();
  }

  addToCart(): void {
    if (!this.isLoggedIn) {
      if (this.product) {
        this.router.navigate(['/auth/login'], {
          queryParams: {
            returnUrl: this.router.url,
            addToCartProductId: this.product.id,
            quantity: this.quantity
          }
        });
      } else {
        this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url }});
      }
      return;
    }

    if (this.product && this.currentUserId && this.quantity > 0) {
      this.cartService.addToCart(this.currentUserId, this.product.id, this.quantity).subscribe({
        next: (cart) => {
          console.log('Product added to cart:', cart);
          alert(`${this.quantity} x ${this.product?.name} successfully added to your cart!`);
        },
        error: (err) => {
          console.error('Error adding product to cart:', err);
          this.error = `Failed to add product to cart. ${err.error?.message || 'Please try again.'}`;
        }
      });
    } else {
      if (!this.product) {
        this.error = 'Product details not available. Cannot add to cart.';
      } else if (!this.currentUserId) {
        this.error = 'User information not available. Cannot add to cart.';
      } else {
        this.error = 'Invalid quantity. Cannot add to cart.';
      }
      console.error('Cannot add to cart. Product:', this.product, 'Current User ID:', this.currentUserId, 'Quantity:', this.quantity);
    }
  }
}
