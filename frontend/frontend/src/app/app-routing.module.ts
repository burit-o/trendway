import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { CartComponent } from './cart/cart.component';
import { ProfileComponent } from './profile/profile.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentCancelComponent } from './components/payment-cancel/payment-cancel.component';
import { SellerDashboardComponent } from './seller-dashboard/seller-dashboard.component';
import { RoleGuard } from './auth/guards/role.guard';
import { SellerProductsComponent } from './seller-dashboard/seller-products/seller-products.component';
import { SellerOrdersComponent } from './seller-dashboard/seller-orders/seller-orders.component';
import { RefundRequestsComponent } from './refund-requests/refund-requests.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './admin-dashboard/user-management/user-management.component';
import { ProductManagementComponent } from './admin-dashboard/product-management/product-management.component';
import { OrderManagementComponent } from './admin-dashboard/order-management/order-management.component';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent)
  },
  {
    path: 'products/:id',
    component: ProductDetailComponent
  },
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'payment-success',
    component: PaymentSuccessComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'payment-cancel',
    component: PaymentCancelComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    component: SellerDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'SELLER' },
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      { path: 'products', component: SellerProductsComponent },
      { path: 'orders', component: SellerOrdersComponent },
      { path: 'refund-requests', component: RefundRequestsComponent }
    ]
  },
  {
    path: 'panel',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'ADMIN' },
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: UserManagementComponent },
      { path: 'products', component: ProductManagementComponent },
      { path: 'orders', component: OrderManagementComponent }
    ]
  },
  {
    path: 'refund-requests',
    component: RefundRequestsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'SELLER' }
  },
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
