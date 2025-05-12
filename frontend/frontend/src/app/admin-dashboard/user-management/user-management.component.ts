import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../auth/models/auth.model';
import { Address } from '../../models/address.model';
import { UserService } from '../../services/user.service';
import { AddressService } from '../../services/address.service';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';

interface UserWithDetails extends User {
  address?: Address;
  status: 'active' | 'banned';
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-management.component.html',
  styles: []
})
export class UserManagementComponent implements OnInit {
  users: UserWithDetails[] = [];
  loading = false;
  error = '';
  isAdmin = false;

  constructor(
    private userService: UserService,
    private addressService: AddressService,
    public authService: AuthService,
    private router: Router
  ) {
    // Check if the current user has ADMIN role
    this.isAdmin = this.authService.hasRole('ADMIN');
    console.log('Current user role check for ADMIN access:', this.isAdmin);
    
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      console.log('Current user role:', currentUser.role);
    }
    
    if (!this.isAdmin) {
      console.warn('Unauthorized access attempt to User Management component');
      this.error = 'You do not have permission to access this page. Admin role required.';
      setTimeout(() => this.router.navigate(['/products']), 3000);
    }
  }

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers()
      .subscribe({
        next: (users) => {
          this.users = users.map(user => ({
            ...user,
            status: user.isBanned ? 'banned' : 'active'
          }));
          this.loadUserAddresses();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.error = error.message || 'Failed to load users. Please try again later.';
          this.loading = false;
          
          if (error.status === 403) {
            // If 403 Forbidden response, redirect to login
            setTimeout(() => {
              this.authService.logout();
              this.router.navigate(['/auth/login'], { 
                queryParams: { returnUrl: '/panel/users' } 
              });
            }, 3000);
          }
        }
      });
  }

  loadUserAddresses(): void {
    this.users.forEach(user => {
      this.addressService.getAddressesByUserId(user.id)
        .subscribe({
          next: (addresses) => {
            if (addresses && addresses.length > 0) {
              user.address = addresses[0]; // Just get the first address for simplicity
            }
          },
          error: (error) => {
            console.error(`Error loading address for user ${user.id}:`, error);
          }
        });
    });
  }

  toggleUserBan(user: UserWithDetails): void {
    const isBanned = user.status === 'banned';
    
    if (isBanned) {
      this.userService.unbanUser(user.id)
        .subscribe({
          next: (response) => {
            user.status = 'active';
            user.isBanned = false;
            console.log(`User ${user.id} unbanned successfully:`, response);
            this.refreshUsers();
          },
          error: (error) => {
            console.error(`Error unbanning user ${user.id}:`, error);
            this.error = error.message || `Failed to unban user. Please try again.`;
          }
        });
    } else {
      this.userService.banUser(user.id)
        .subscribe({
          next: (response) => {
            user.status = 'banned';
            user.isBanned = true;
            console.log(`User ${user.id} banned successfully:`, response);
            this.refreshUsers();
          },
          error: (error) => {
            console.error(`Error banning user ${user.id}:`, error);
            this.error = error.message || `Failed to ban user. Please try again.`;
          }
        });
    }
  }

  refreshUsers(): void {
    setTimeout(() => {
      this.loadUsers();
    }, 500);
  }
} 