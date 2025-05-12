import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { OrderService } from '../../services/order.service';
import { Order, OrderItem } from '../../models/order.model';
import { OrderItemStatus } from '../../models/order-item.model';
import { ChangeItemStatusModalComponent, ORDER_ITEM_STATUSES } from '../change-item-status-modal/change-item-status-modal.component';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, ChangeItemStatusModalComponent],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss']
})
export class OrderManagementComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  error: string = '';
  isAdmin = false;
  expandedOrderIndex: number | null = null;
  
  // OrderItemStatus enum'ını template'te kullanmak için ekle
  public orderItemStatus = OrderItemStatus;
  public readonly allowedStatusesForChange = ORDER_ITEM_STATUSES;
  
  // Modal yönetimi için
  isChangeStatusModalVisible = false;
  selectedOrderForStatusChange: Order | null = null;
  selectedItemForStatusChange: OrderItem | null = null;

  constructor(
    private orderService: OrderService,
    public authService: AuthService
  ) {
    // Admin yetkisi kontrolü
    this.isAdmin = this.authService.hasRole('ADMIN');
    if (!this.isAdmin) {
      console.warn('Unauthorized access attempt to Order Management component');
      this.error = 'Bu sayfaya erişim izniniz yok. Yönetici rolü gereklidir.';
    }
  }

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadAllOrders();
    }
  }

  loadAllOrders(): void {
    this.loading = true;
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load orders:', error);
        this.error = error.message || 'Siparişler yüklenemedi. Lütfen daha sonra tekrar deneyin.';
        this.loading = false;
      }
    });
  }

  toggleOrderDetails(index: number): void {
    if (this.expandedOrderIndex === index) {
      this.expandedOrderIndex = null;
    } else {
      this.expandedOrderIndex = index;
    }
  }

  openChangeItemStatusModal(order: Order, item: OrderItem): void {
    // İptal edilmiş veya teslim edilmiş ürünler için modal açılmamalı
    if (item.status === OrderItemStatus.DELIVERED || 
        item.status === OrderItemStatus.CANCELED || 
        item.status === OrderItemStatus.CANCELLED_BY_SELLER ||
        item.status === OrderItemStatus.REFUNDED) {
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
      this.error = 'Durum güncellenemedi: Geçersiz veri.';
      return;
    }
    this.loading = true;
    this.orderService.updateOrderItemStatus(event.itemId, event.newStatus).subscribe({
      next: () => {
        this.loading = false;
        this.handleCloseChangeStatusModal();
        this.loadAllOrders(); // Listeyi yenile
        console.log(`Item ${event.itemId} status updated to ${event.newStatus}`);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error updating item status:', err);
        this.error = `Ürün durumu güncellenemedi: ${err.error?.message || err.message}`;
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  promptCancelOrderItem(item: OrderItem, orderId: number): void {
    if (!item || item.id === undefined) {
      console.error('Cannot cancel item: Item ID is missing.');
      this.error = 'Ürün iptal edilemiyor: Ürün ID bilgisi eksik.';
      return;
    }

    const confirmCancel = confirm(
      `"${item.productName}" ürününü iptal etmek istediğinizden emin misiniz? ` +
      `Bu işlem geri alınamaz ve stok güncellenecektir.`
    );

    if (confirmCancel) {
      this.loading = true; 
      const itemId = item.id;
      this.orderService.cancelOrderItemBySeller(itemId).subscribe({
        next: (updatedItem) => {
          console.log('Item cancelled successfully:', updatedItem);
          this.loading = false;
          this.loadAllOrders();
        },
        error: (err) => {
          this.loading = false;
          console.error('Error cancelling item:', err);
          this.error = `Ürün iptal edilemedi: ${err.error?.message || err.message}`;
          setTimeout(() => this.error = '', 5000);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PREPARING': return 'bg-secondary';
      case 'SHIPPED': return 'bg-info';
      case 'DELIVERED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      case 'REFUNDED': return 'bg-warning text-dark';
      case 'EXCHANGE_REQUESTED': return 'bg-warning text-dark';
      case 'RETURNED': return 'bg-dark';
      default: return 'bg-secondary';
    }
  }

  getItemStatusClass(status: string): string {
    switch (status) {
      case 'PREPARING': return 'bg-secondary';
      case 'SHIPPED': return 'bg-info';
      case 'DELIVERED': return 'bg-success';
      case 'CANCELLED': 
      case 'CANCELED': 
      case 'CANCELLED_BY_SELLER': return 'bg-danger';
      case 'REFUNDED': return 'bg-warning text-dark';
      case 'EXCHANGE_REQUESTED': 
      case 'RETURN_REQUESTED': return 'bg-warning text-dark';
      case 'RETURNED': return 'bg-dark';
      default: return 'bg-secondary';
    }
  }
  
  // Sipariş durumlarını Türkçe'ye çeviren metod
  getStatusTranslation(status: string): string {
    switch (status) {
      case 'PREPARING': return 'HAZIRLANIYOR';
      case 'SHIPPED': return 'KARGODA';
      case 'DELIVERED': return 'TESLİM EDİLDİ';
      case 'CANCELLED': return 'İPTAL EDİLDİ';
      case 'REFUNDED': return 'İADE EDİLDİ';
      case 'EXCHANGE_REQUESTED': return 'DEĞİŞİM TALEBİ';
      case 'RETURNED': return 'İADE EDİLDİ';
      default: return status;
    }
  }
  
  // Sipariş öğesi durumlarını Türkçe'ye çeviren metod
  getItemStatusTranslation(status: string): string {
    switch (status) {
      case 'PREPARING': return 'HAZIRLANIYOR';
      case 'SHIPPED': return 'KARGODA';
      case 'DELIVERED': return 'TESLİM EDİLDİ';
      case 'CANCELLED': 
      case 'CANCELED': return 'İPTAL EDİLDİ';
      case 'CANCELLED_BY_SELLER': return 'SATICI TARAFINDAN İPTAL';
      case 'REFUNDED': return 'İADE EDİLDİ';
      case 'EXCHANGE_REQUESTED': return 'DEĞİŞİM TALEBİ';
      case 'RETURN_REQUESTED': return 'İADE TALEBİ';
      case 'RETURNED': return 'İADE EDİLDİ';
      default: return status;
    }
  }

  refreshOrders(): void {
    this.loadAllOrders();
  }
}
