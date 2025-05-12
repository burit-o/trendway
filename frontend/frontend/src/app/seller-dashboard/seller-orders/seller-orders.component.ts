import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Order, OrderItem } from '../../models/order.model';
import { OrderItemStatus } from '../../models/order-item.model';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../auth/services/auth.service'; // Seller ID için
import { ChangeItemStatusModalComponent, ORDER_ITEM_STATUSES } from '../change-item-status-modal/change-item-status-modal.component';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, ChangeItemStatusModalComponent],
  templateUrl: './seller-orders.component.html',
  styleUrls: ['./seller-orders.component.scss']
})
export class SellerOrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = false;
  error: string | null = null;
  currentSellerId: number | null = null;
  expandedOrderIndex: number | null = null; // Hangi siparişin detaylarının açık olduğunu tutar

  // OrderItemStatus enum'ını template'te kullanmak için ekle
  public orderItemStatus = OrderItemStatus;
  public readonly allowedStatusesForChange = ORDER_ITEM_STATUSES; // Modal'ın kullanacağı statüleri de public yapalım

  // Modal yönetimi için
  isChangeStatusModalVisible = false;
  selectedOrderForStatusChange: Order | null = null;
  selectedItemForStatusChange: OrderItem | null = null;

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
    // İptal edilmiş veya teslim edilmiş ürünler için modal açılmamalı (HTML'de zaten disabled)
    // Ama yine de bir kontrol ekleyebiliriz.
    if (item.status === OrderItemStatus.DELIVERED || 
        item.status === OrderItemStatus.CANCELED || 
        item.status === OrderItemStatus.CANCELLED_BY_SELLER) {
      console.warn('Cannot change status for item in status:', item.status);
      return;
    }
    this.selectedOrderForStatusChange = order;
    this.selectedItemForStatusChange = item;
    this.isChangeStatusModalVisible = true;
  }

  handleCloseChangeStatusModal(): void {
    this.isChangeStatusModalVisible = false;
    this.selectedOrderForStatusChange = null;
    this.selectedItemForStatusChange = null;
  }

  handleSaveItemStatus(event: { itemId: number, newStatus: string }): void {
    if (!event || event.itemId === undefined || !event.newStatus) {
      console.error('Invalid event data for saving status:', event);
      this.error = 'Failed to update status: Invalid data.';
      return;
    }
    this.isLoading = true;
    this.orderService.updateOrderItemStatus(event.itemId, event.newStatus).subscribe({
      next: () => {
        this.isLoading = false;
        this.handleCloseChangeStatusModal();
        this.loadSellerOrders(); // Listeyi yenile
         // Başarı mesajı (örn: toaster)
        console.log(`Item ${event.itemId} status updated to ${event.newStatus}`);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error updating item status:', err);
        this.error = `Failed to update item status: ${err.error?.message || err.message}`;
        // Hata mesajını bir süre sonra temizle
        setTimeout(() => this.error = null, 5000);
      }
    });
  }

  promptCancelOrderItem(item: OrderItem, orderId: number): void {
    if (!item || item.id === undefined) {
      console.error('Cannot cancel item: Item ID is missing.');
      this.error = 'Cannot cancel item: Item ID is missing.';
      return;
    }

    const confirmCancel = confirm(
      `Are you sure you want to cancel the item "${item.productName}"? ` +
      `This action cannot be undone and the stock will be updated.`
    );

    if (confirmCancel) {
      this.isLoading = true; 
      // Item ID'nin varlığından emin olalım
      const itemId = item.id;
      this.orderService.cancelOrderItemBySeller(itemId).subscribe({
        next: (updatedItem) => {
          console.log('Item cancelled successfully by seller:', updatedItem);
          this.isLoading = false;
          this.loadSellerOrders(); 
          // Başarı mesajı (örn: toaster service ile)
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error cancelling item by seller:', err);
          this.error = `Failed to cancel item: ${err.error?.message || err.message}`;
          setTimeout(() => this.error = null, 5000);
        }
      });
    }
  }
} 