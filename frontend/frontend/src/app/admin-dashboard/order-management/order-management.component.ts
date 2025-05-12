import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss']
})
export class OrderManagementComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  error = '';
  isAdmin = false;
  expandedOrderIndex: number | null = null;

  constructor(
    private orderService: OrderService,
    public authService: AuthService
  ) {
    // Admin yetkisi kontrolü
    this.isAdmin = this.authService.hasRole('ADMIN');
    if (!this.isAdmin) {
      console.warn('Unauthorized access attempt to Order Management component');
      this.error = 'You do not have permission to access this page. Admin role required.';
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
        this.error = error.message || 'Failed to load orders. Please try again later.';
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

  refreshOrders(): void {
    this.loadAllOrders();
  }
}
