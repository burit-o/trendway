import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Order, OrderItem } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../auth/services/auth.service'; // Seller ID için

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './seller-orders.component.html',
  styleUrls: ['./seller-orders.component.scss']
})
export class SellerOrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = false;
  error: string | null = null;
  currentSellerId: number | null = null;
  expandedOrderIndex: number | null = null; // Hangi siparişin detaylarının açık olduğunu tutar

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id && currentUser.role === 'SELLER') {
      this.currentSellerId = currentUser.id;
      this.loadSellerOrders();
    } else {
      this.error = 'User is not a seller or not logged in.';
      console.error(this.error);
    }
  }

  loadSellerOrders(): void {
    if (!this.currentSellerId) {
      this.error = 'Seller ID not found. Cannot load orders.';
      return;
    }
    this.isLoading = true;
    this.orderService.getOrdersBySeller().subscribe({
      next: (data) => {
        this.orders = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load orders.';
        console.error('Error loading seller orders:', err);
        this.isLoading = false;
      }
    });
  }

  toggleOrderDetails(index: number): void {
    if (this.expandedOrderIndex === index) {
      this.expandedOrderIndex = null; // Zaten açıksa kapat
    } else {
      this.expandedOrderIndex = index; // Değilse aç
    }
  }

  openChangeItemStatusModal(order: Order, item: OrderItem): void {
    console.log("Change status for item:", item, "in order:", order);
    // TODO: Durum değiştirme modalını açma mantığı eklenecek
    // Bu modal, OrderItemStatus enum'undaki değerleri listelemeli
  }

  cancelOrderItem(order: Order, item: OrderItem): void {
    console.log("Cancel item:", item, "in order:", order);
    // TODO: OrderItem iptal etme mantığı eklenecek
    // Backend'e istek gönderilecek, stok güncellenecek, UI güncellenecek
    // İptal işlemi sonrası siparişin genel durumu da güncellenebilir.
    alert('Cancel order item functionality is not yet implemented.');
  }
} 