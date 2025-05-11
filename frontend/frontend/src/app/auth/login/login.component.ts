import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartService } from '../../services/cart.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: false
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.error = '';

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const loginData = {
      email: this.f['email'].value,
      password: this.f['password'].value
    };

    console.log('Attempting login with:', { email: loginData.email });

    this.authService.login(loginData)
    .pipe(first())
    .subscribe({
      next: (response) => {
        // Query parametrelerini kontrol et
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/'; // Varsayılan olarak ana sayfa
        const addToCartProductId = this.route.snapshot.queryParams['addToCartProductId'];
        const quantity = +this.route.snapshot.queryParams['quantity']; // Sayıya çevir

        if (addToCartProductId && quantity > 0 && response.userId) {
          this.cartService.addToCart(response.userId, +addToCartProductId, quantity)
          .pipe(first())
          .subscribe({
            next: () => {
              console.log(`Product ${addToCartProductId} added to cart for user ${response.userId}`);
              this.router.navigateByUrl(returnUrl); // returnUrl'e yönlendir
            },
            error: (cartError) => {
              console.error('Failed to add item to cart after login:', cartError);
              // Sepete ekleme başarısız olsa bile kullanıcıyı yönlendir
              this.router.navigateByUrl(returnUrl);
            }
          });
        } else {
          // Normal rol bazlı yönlendirme
          switch(response.role) {
            case 'CUSTOMER':
              this.router.navigate(['/products']);
              break;
            case 'SELLER':
              this.router.navigate(['/dashboard']);
              break;
            case 'ADMIN':
              this.router.navigate(['/panel']);
              break;
            default:
              this.router.navigate(['/']);
          }
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.error = error.error?.message || 'An error occurred during login';
        this.loading = false;
      },
      complete: () => {
        console.log('Login request completed');
      }
    });
  }
}
