import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderItem, RefundStatus } from '../models/order-item.model';
import { OrderService } from '../services/order.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { User } from '../auth/models/auth.model';

@Component({
  selector: 'app-refund-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './refund-requests.component.html',
  styleUrls: ['./refund-requests.component.scss']
})
export class RefundRequestsComponent implements OnInit {

  refundRequests: OrderItem[] = [];
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  rejectionReason = '';
  currentUser: User | null = null;
  isRejecting = false;
  selectedItemId: number | null = null;
  
  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    
    if (!this.currentUser || !this.authService.hasRole('SELLER')) {
      this.router.navigate(['/']);
      return;
    }
    
    this.loadRefundRequests();
  }
  
  loadRefundRequests(): void {
    this.isLoading = true;
    this.error = null;
    this.orderService.getRefundRequestsBySeller().subscribe({
      next: (requests) => {
        this.refundRequests = requests;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load refund requests. Please try again later.';
        console.error('Error loading refund requests:', err);
        this.isLoading = false;
      }
    });
  }
  
  approveRefund(orderItemId: number): void {
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    
    this.orderService.approveRefundRequest(orderItemId).subscribe({
      next: () => {
        this.successMessage = 'Refund request approved successfully.';
        // Listeyi güncelle
        this.loadRefundRequests();
      },
      error: (err) => {
        this.error = 'Failed to approve refund request.';
        console.error('Error approving refund request:', err);
        this.isLoading = false;
      }
    });
  }
  
  showRejectionDialog(orderItemId: number): void {
    this.isRejecting = true;
    this.selectedItemId = orderItemId;
    this.rejectionReason = '';
  }
  
  cancelRejection(): void {
    this.isRejecting = false;
    this.selectedItemId = null;
    this.rejectionReason = '';
  }
  
  rejectRefund(): void {
    if (!this.selectedItemId) return;
    
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    
    this.orderService.rejectRefundRequest(this.selectedItemId, this.rejectionReason).subscribe({
      next: () => {
        this.successMessage = 'Refund request rejected successfully.';
        this.isRejecting = false;
        this.selectedItemId = null;
        this.rejectionReason = '';
        // Listeyi güncelle
        this.loadRefundRequests();
      },
      error: (err) => {
        this.error = 'Failed to reject refund request.';
        console.error('Error rejecting refund request:', err);
        this.isLoading = false;
      }
    });
  }
  
  formatDate(date: any): string {
    if (!date) return 'N/A';
    
    if (typeof date === 'string') {
      return new Date(date).toLocaleString();
    }
    
    return date.toLocaleString();
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'DELIVERED': return 'bg-success';
      case 'PREPARING': return 'bg-warning text-dark';
      case 'SHIPPED': return 'bg-primary';
      case 'CANCELLED': case 'CANCELLED_BY_SELLER': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
