import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../auth/models/auth.model';
import { UserService } from '../../services/user.service'; // Update path if needed

@Component({
  selector: 'app-seller-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seller-requests.component.html',
  styleUrls: ['./seller-requests.component.scss']
})
export class SellerRequestsComponent implements OnInit {
  requests: User[] = [];
  isLoading = false;
  error: string | null = null;
  actionError: string | null = null; // For errors during approve/reject
  actionSuccess: string | null = null; // For success messages

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadSellerRequests();
  }

  loadSellerRequests(): void {
    this.isLoading = true;
    this.error = null;
    this.userService.getSellerRequests().subscribe({ // We will add this method to UserService
      next: (data) => {
        this.requests = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading seller requests:', err);
        this.error = 'Failed to load seller requests. Please try again.';
        this.isLoading = false;
      }
    });
  }

  approveRequest(userId: number): void {
    this.clearMessages();
    this.userService.approveSellerRequest(userId).subscribe({ // We will add this method to UserService
      next: (message) => {
        this.actionSuccess = message || 'Seller request approved successfully.';
        this.loadSellerRequests(); // Refresh the list
      },
      error: (err) => {
        console.error('Error approving seller request:', err);
        this.actionError = err.error?.message || err.error || 'Failed to approve seller request.';
      }
    });
  }

  rejectRequest(userId: number): void {
    if (confirm('Are you sure you want to reject this seller request?')) {
      this.clearMessages();
      this.userService.rejectSellerRequest(userId).subscribe({ // We will add this method to UserService
        next: (message) => {
          this.actionSuccess = message || 'Seller request rejected successfully.';
          this.loadSellerRequests(); // Refresh the list
        },
        error: (err) => {
          console.error('Error rejecting seller request:', err);
          this.actionError = err.error?.message || err.error || 'Failed to reject seller request.';
        }
      });
    }
  }

  clearMessages(): void {
    this.actionError = null;
    this.actionSuccess = null;
  }
}
