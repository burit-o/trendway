import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { User } from '../auth/models/auth.model';
import { Address } from '../models/address.model';
import { AddressService } from '../services/address.service';
import { Order } from '../models/order.model';
import { OrderService } from '../services/order.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Category } from '../models/category.model';
import { CategoryService } from '../services/category.service';
import { Cart } from '../models/cart.model';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  addresses: Address[] = [];
  isLoadingAddresses = false;
  addressError: string | null = null;
  
  addressForm: FormGroup;
  showAddressForm = false;
  editingAddressId: number | null = null;

  orders: Order[] = [];
  isLoadingOrders = false;
  orderError: string | null = null;

  accountDetailsForm: FormGroup;
  isUpdatingAccount = false;
  accountUpdateError: string | null = null;
  accountUpdateSuccess: string | null = null;

  changePasswordForm: FormGroup;
  isChangingPassword = false;
  changePasswordError: string | null = null;
  changePasswordSuccess: string | null = null;

  public accountDetailsSubmitted = false;
  public addressFormSubmitted = false;
  public changePasswordFormSubmitted = false;

  isLoggedIn = false;
  categories: Category[] = [];
  isLoadingCategories = false;
  categoryError: string | null = null;
  cartItemCount = 0;
  cartError: string | null = null;

  constructor(
    private authService: AuthService, 
    private addressService: AddressService,
    private orderService: OrderService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private cartService: CartService
  ) {
    console.log('ProfileComponent constructor called');
    this.addressForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['', Validators.required],
      contactPhone: [''],
    });

    this.accountDetailsForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }]
    });

    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    console.log('ProfileComponent ngOnInit called');
    this.currentUser = this.authService.currentUserValue;
    this.isLoggedIn = this.authService.isLoggedIn();

    if (this.currentUser && this.currentUser.id) {
      this.loadAddresses(this.currentUser.id);
      this.loadOrders(this.currentUser.id);
      this.accountDetailsForm.patchValue(this.currentUser);
      this.loadCategories();
      this.updateCartCount();
    }
    this.accountDetailsSubmitted = false;
    this.addressFormSubmitted = false;
    this.changePasswordFormSubmitted = false;
  }

  loadAddresses(userId: number): void {
    this.isLoadingAddresses = true;
    this.addressError = null;
    this.addressService.getAddressesByUserId(userId).subscribe({
      next: (data) => {
        this.addresses = data;
        this.isLoadingAddresses = false;
      },
      error: (err) => {
        console.error('Error fetching addresses:', err);
        this.addressError = 'Failed to load addresses.';
        this.isLoadingAddresses = false;
      }
    });
  }

  loadOrders(userId: number): void {
    this.isLoadingOrders = true;
    this.orderError = null;
    this.orderService.getOrdersByUserId(userId).subscribe({
      next: (data) => {
        this.orders = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.isLoadingOrders = false;
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        this.orderError = 'Failed to load order history.';
        this.isLoadingOrders = false;
      }
    });
  }

  openAddressForm(address?: Address): void {
    this.showAddressForm = true;
    this.editingAddressId = null;
    this.addressForm.reset();
    this.addressFormSubmitted = false;
    if (address) {
      this.editingAddressId = address.id || null;
      this.addressForm.patchValue(address);
    }
  }

  closeAddressForm(): void {
    this.showAddressForm = false;
    this.editingAddressId = null;
    this.addressForm.reset();
    this.addressFormSubmitted = false;
  }

  saveAddress(): void {
    this.addressFormSubmitted = true;
    if (this.addressForm.invalid || !this.currentUser) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const formValue = this.addressForm.value;
    this.isLoadingAddresses = true;

    if (this.editingAddressId) {
      this.addressService.updateAddress(this.editingAddressId, formValue).subscribe({
        next: () => {
          this.loadAddresses(this.currentUser!.id);
          this.closeAddressForm();
        },
        error: (err) => {
          this.addressError = 'Failed to update address.';
          console.error(err);
          this.isLoadingAddresses = false;
        }
      });
    } else {
      this.addressService.addAddress(formValue).subscribe({
        next: () => {
          this.loadAddresses(this.currentUser!.id);
          this.closeAddressForm();
        },
        error: (err) => {
          this.addressError = 'Failed to add address.';
          console.error(err);
          this.isLoadingAddresses = false;
        }
      });
    }
  }

  deleteAddress(addressId: number): void {
    if (confirm('Are you sure you want to delete this address?') && this.currentUser) {
      this.isLoadingAddresses = true;
      this.addressService.deleteAddress(addressId).subscribe({
        next: () => {
          this.loadAddresses(this.currentUser!.id);
        },
        error: (err) => {
          this.addressError = 'Failed to delete address.';
          console.error(err);
          this.isLoadingAddresses = false;
        }
      });
    }
  }

  get af() { return this.addressForm.controls; }

  getOrderStatusClass(status: string): string {
    if (!status) return 'bg-secondary';
    status = status.toUpperCase();
    switch (status) {
      case 'PENDING':
        return 'bg-warning text-dark';
      case 'PROCESSING':
      case 'CONFIRMED': 
        return 'bg-info text-dark';
      case 'SHIPPED':
        return 'bg-primary';
      case 'DELIVERED':
        return 'bg-success';
      case 'CANCELLED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  updateAccountDetails(): void {
    this.accountDetailsSubmitted = true;
    if (this.accountDetailsForm.invalid || !this.currentUser) {
      this.accountDetailsForm.markAllAsTouched();
      return;
    }

    this.isUpdatingAccount = true;
    this.accountUpdateError = null;
    this.accountUpdateSuccess = null;

    const updatedData = {
      firstName: this.accountDetailsForm.value.firstName,
      lastName: this.accountDetailsForm.value.lastName
    };

    this.authService.updateUser(this.currentUser.id, updatedData).subscribe({
      next: (updatedUser: User) => {
        this.isUpdatingAccount = false;
        this.accountUpdateSuccess = 'Account details updated successfully!';
        this.currentUser = updatedUser;
        this.authService.setCurrentUser(updatedUser);
        this.accountDetailsForm.patchValue(updatedUser);
        this.accountDetailsSubmitted = false;
        setTimeout(() => this.accountUpdateSuccess = null, 3000);
      },
      error: (err: any) => {
        this.isUpdatingAccount = false;
        this.accountUpdateError = err.error?.message || 'Failed to update account details.';
        console.error('Error updating account:', err);
        setTimeout(() => this.accountUpdateError = null, 5000);
      }
    });
  }

  get adf() { return this.accountDetailsForm.controls; }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword ? null : { mismatch: true };
  }

  changePassword(): void {
    this.changePasswordFormSubmitted = true;
    if (this.changePasswordForm.invalid || !this.currentUser) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    if (this.changePasswordForm.hasError('mismatch')) {
        this.cpd['confirmNewPassword'].setErrors({mismatch: true});
        return;
    }

    this.isChangingPassword = true;
    this.changePasswordError = null;
    this.changePasswordSuccess = null;

    const payload = {
      currentPassword: this.changePasswordForm.value.currentPassword,
      newPassword: this.changePasswordForm.value.newPassword
    };

    this.authService.changePassword(payload).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.changePasswordSuccess = 'Password changed successfully!';
        this.changePasswordForm.reset();
        this.changePasswordFormSubmitted = false;
        setTimeout(() => this.changePasswordSuccess = null, 3000);
      },
      error: (err: any) => {
        this.isChangingPassword = false;
        this.changePasswordError = err.error?.message || 'Failed to change password.';
        console.error('Error changing password:', err);
        setTimeout(() => this.changePasswordError = null, 5000);
      }
    });
  }

  get cpd() { return this.changePasswordForm.controls; }

  reorder(order: Order): void {
    console.log('Reorder:', order);
    // TODO: Implement reorder functionality
  }

  viewInvoice(order: Order): void {
    console.log('View Invoice for:', order);
    // TODO: Implement view invoice functionality
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryError = null;
    this.categoryService.getAllCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = categories;
        this.isLoadingCategories = false;
      },
      error: (error: Error) => {
        this.categoryError = 'Failed to load categories.';
        this.isLoadingCategories = false;
        console.error('Error loading categories:', error);
      }
    });
  }

  updateCartCount(): void {
    if (this.isLoggedIn && this.currentUser?.id) {
      this.cartService.getCart(this.currentUser.id).subscribe({
        next: (cart: Cart) => {
          this.cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          this.cartError = null;
        },
        error: (error: Error) => {
          this.cartError = 'Failed to update cart count.';
          console.error('Error updating cart count:', error);
        }
      });
    }
  }

  onSelectCategory(category?: Category): void {
    const categoryId = category ? category.id : null;
    this.router.navigate(['/products'], { queryParams: { categoryId: categoryId } });
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.cartItemCount = 0;
    this.currentUser = null;
    this.router.navigate(['/auth/login']);
  }
}
