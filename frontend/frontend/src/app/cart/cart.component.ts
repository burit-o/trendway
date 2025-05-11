import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { AuthService } from '../auth/services/auth.service';
import { Cart, CartItem } from '../models/cart.model';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrderService } from '../services/order.service';
import { StripeService } from '../services/stripe.service';
import { Order } from '../models/order.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  isLoading = true;
  error: string | null = null;
  updatingItemId: number | null = null; // Hangi ürünün adedinin güncellendiğini takip etmek için
  isProcessingCheckout = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private orderService: OrderService,
    private stripeService: StripeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.isLoading = true;
      this.error = null;
      this.cartService.getCart(currentUser.id).subscribe({
        next: (cartData) => {
          this.cart = cartData;
          console.log('Cart loaded:', JSON.parse(JSON.stringify(this.cart))); // Debug için eklendi
          this.isLoading = false;
          this.updatingItemId = null;
        },
        error: (err) => {
          console.error('Error fetching cart:', err);
          this.error = 'Failed to load your cart. Please try again.';
          this.isLoading = false;
          this.updatingItemId = null;
        }
      });
    } else {
      this.error = 'User not logged in. Please login to view your cart.';
      this.isLoading = false;
      // Gerekirse login sayfasına yönlendirme yapılabilir.
    }
  }

  increaseQuantity(item: CartItem): void {
    if (!item || !item.product || this.updatingItemId === item.product.id) return;
    // Stok kontrolü
    if (item.product.stock === undefined) {
      console.warn('Stock information is missing for product:', item.product.name);
    } else if (item.quantity >= item.product.stock) {
      console.log('Cannot increase quantity, stock limit reached for:', item.product.name);
      this.error = `Cannot add more. Only ${item.product.stock} of ${item.product.name} in stock.`;
      setTimeout(() => this.error = null, 3000); // Hata mesajını bir süre sonra kaldır
      return;
    }
    const newQuantity = item.quantity + 1;
    console.log(`Increasing quantity for ${item.product.name} (ID: ${item.product.id}) from ${item.quantity} to ${newQuantity}. Stock: ${item.product.stock}`); // Debug
    this.updateCartItem(item.product.id, newQuantity);
  }

  decreaseQuantity(item: CartItem): void {
    if (!item || !item.product || this.updatingItemId === item.product.id) return;
    const newQuantity = item.quantity - 1;
    console.log(`Decreasing quantity for ${item.product.name} (ID: ${item.product.id}) from ${item.quantity} to ${newQuantity}. Stock: ${item.product.stock}`); // Debug
    if (newQuantity < 1) {
      this.removeFromCart(item.product.id);
    } else {
      this.updateCartItem(item.product.id, newQuantity);
    }
  }

  onQuantityChange(item: CartItem, event: Event): void {
    if (!item || !item.product || this.updatingItemId === item.product.id) return;

    const inputElement = event.target as HTMLInputElement;
    let newQuantity = parseInt(inputElement.value, 10);

    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
      inputElement.value = newQuantity.toString();
    }
    
    // Stok kontrolü
    if (item.product.stock === undefined) {
      console.warn('Stock information is missing for product:', item.product.name);
    } else if (newQuantity > item.product.stock) {
      newQuantity = item.product.stock;
      inputElement.value = newQuantity.toString();
      this.error = `Max quantity is ${item.product.stock} for ${item.product.name}.`;
      setTimeout(() => this.error = null, 3000);
    }
    console.log(`Quantity changed via input for ${item.product.name} (ID: ${item.product.id}) to ${newQuantity}. Current item.quantity: ${item.quantity}. Stock: ${item.product.stock}`); // Debug
    if (item.quantity !== newQuantity) {
      this.updateCartItem(item.product.id, newQuantity);
    } else {
      // Eğer input düzeltildiyse ama asıl item.quantity değişmediyse, yine de input'u eski değere döndürebiliriz veya olduğu gibi bırakabiliriz.
      // Şimdilik olduğu gibi bırakıyoruz, çünkü updateCartItem çağrılmayacak.
      // inputElement.value = item.quantity.toString(); // Eğer inputu eski değere zorlamak istersek
    }
  }

  updateCartItem(productId: number, quantity: number): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.updatingItemId = productId; // Güncellenmekte olan ürünü işaretle
      this.error = null; // Önceki hataları temizle

      this.cartService.addToCart(currentUser.id, productId, quantity).subscribe({
        next: (updatedCart) => {
          // Sadece güncellenen ürünün bilgisini güncellemek daha performanslı olabilir
          // ancak tüm sepeti güncellemek (loadCart) daha basit ve tutarlıdır.
          this.cart = updatedCart; // Backend direkt güncel sepeti dönüyorsa bunu kullan
          // this.loadCart(); // Veya tüm sepeti yeniden yükle
          this.updatingItemId = null;
        },
        error: (err) => {
          console.error('Error updating cart item:', err);
          this.error = `Failed to update item (ID: ${productId}) quantity. ${err.error?.message || ''}`;
          // Hata durumunda tüm sepeti yeniden yükleyerek tutarlılığı sağlamak iyi bir fikir olabilir.
          this.loadCart(); // Hata sonrası en güncel hali al
        }
      });
    }
  }

  removeFromCart(productId: number): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.updatingItemId = productId; // Kaldırılmakta olan ürünü işaretle
      this.error = null;

      this.cartService.removeFromCart(currentUser.id, productId).subscribe({
        next: (updatedCart) => {
          this.cart = updatedCart;
          // this.loadCart(); // Veya tüm sepeti yeniden yükle
          this.updatingItemId = null;
        },
        error: (err) => {
          console.error('Error removing item from cart:', err);
          this.error = `Failed to remove item (ID: ${productId}) from cart. ${err.error?.message || ''}`;
          this.loadCart();
        }
      });
    }
  }

  clearCart(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      if(confirm("Are you sure you want to clear your entire cart?")) {
        this.isLoading = true; // Tüm sepeti etkileyen bir işlem
        this.error = null;
        this.cartService.clearCart(currentUser.id).subscribe({
          next: () => {
            this.loadCart(); // Sepeti yeniden yükleyerek boş olduğunu ve güncel durumu teyit et
          },
          error: (err) => {
            console.error('Error clearing cart:', err);
            this.error = `Failed to clear cart. ${err.error?.message || ''}`;
            this.isLoading = false; // loadCart çağrılmadığı için burada manuel ayarla
          }
        });
      }
    }
  }

  get cartTotal(): number {
    if (!this.cart || !this.cart.items) {
      return 0;
    }
    return this.cart.items.reduce((total, item) => {
        // item.product null veya undefined olabilir mi diye kontrol etmek iyi bir pratik
        const price = item.product ? item.product.price : 0;
        return total + (price * item.quantity);
    }, 0);
  }

  proceedToCheckout(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id || !this.cart || this.cart.items.length === 0) {
      this.error = 'Cannot proceed to checkout. Cart is empty or user is not logged in.';
      this.isProcessingCheckout = false;
      return;
    }

    this.isProcessingCheckout = true;
    this.error = null;

    this.orderService.placeOrderFromCart(currentUser.id).subscribe({
      next: (order: Order) => {
        if (order && order.id) {
          this.stripeService.createCheckoutSession(order.id).subscribe({
            next: (response: { checkoutUrl: string }) => {
              if (response && response.checkoutUrl) {
                this.cart = null;
                window.location.href = response.checkoutUrl;
              } else {
                this.error = 'Failed to retrieve Stripe checkout URL.';
                this.isProcessingCheckout = false;
              }
            },
            error: (stripeError) => {
              console.error('Error creating Stripe checkout session:', stripeError);
              this.error = `Failed to initiate payment: ${stripeError.error?.message || stripeError.message}`;
              this.isProcessingCheckout = false;
            }
          });
        } else {
          this.error = 'Failed to create order.';
          this.isProcessingCheckout = false;
        }
      },
      error: (orderError: any) => {
        console.error('Error placing order:', orderError);
        console.log('Backend error details:', orderError.error); // Backend'den gelen asıl hatayı logla
        this.isProcessingCheckout = false;

        let errorMessage = 'An unknown error occurred.';
        if (typeof orderError.error === 'string') {
          errorMessage = orderError.error;
        } else if (orderError.error && typeof orderError.error.message === 'string') {
          errorMessage = orderError.error.message;
        } else if (typeof orderError.message === 'string') {
          errorMessage = orderError.message;
        }

        if (errorMessage.toLowerCase().includes('user does not have an address')) {
          const confirmRedirect = confirm('You must have a shipping address saved in your profile to place an order. Go to your profile to add an address?');
          if (confirmRedirect) {
            this.router.navigate(['/profile']);
            this.error = 'Redirecting to profile to add address...';
          } else {
            this.error = 'You must have a shipping address saved in your profile to place an order. Please add an address in your profile.';
          }
        } else if (errorMessage.toLowerCase().includes('insufficient stock')) {
          this.error = 'Failed to place order: One or more items in your cart have insufficient stock. Please review your cart.';
          this.loadCart();
        } else {
          this.error = `Failed to place order: ${errorMessage}`;
        }
      }
    });
  }
}
