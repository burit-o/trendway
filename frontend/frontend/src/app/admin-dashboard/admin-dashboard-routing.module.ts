import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { ProductManagementComponent } from './product-management/product-management.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { CategoryManagementComponent } from './category-management/category-management.component';
import { SellerRequestsComponent } from './seller-requests/seller-requests.component';
import { AdminGuard } from '../auth/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: UserManagementComponent },
      { path: 'products', component: ProductManagementComponent },
      { path: 'orders', component: OrderManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'seller-requests', component: SellerRequestsComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminDashboardRoutingModule { } 