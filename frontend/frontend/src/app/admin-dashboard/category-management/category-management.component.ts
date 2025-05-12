import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  loading: boolean = false;
  error: string | null = null;
  success: string | null = null;
  
  categoryForm: FormGroup;
  
  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
    
    // Kullanıcı rolünü kontrol et
    const currentUser = this.authService.currentUserValue;
    console.log('Current user:', currentUser);
    console.log('Is admin:', this.authService.hasRole('ADMIN'));
    console.log('Auth token:', this.authService.getToken());
  }
  
  ngOnInit(): void {
    this.loadCategories();
  }
  
  loadCategories(): void {
    this.loading = true;
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load categories: ' + (err.message || 'Unknown error');
        this.loading = false;
        console.error('Error loading categories:', err);
      }
    });
  }
  
  addCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }
    
    const newCategory: Category = {
      id: 0, // Backend tarafında oluşturulacak
      name: this.categoryForm.value.name
    };
    
    console.log('Attempting to add category:', newCategory);
    console.log('Current auth token:', this.authService.getToken());
    
    this.loading = true;
    this.categoryService.addCategory(newCategory).subscribe({
      next: (category) => {
        console.log('Category added successfully:', category);
        this.categories.push(category);
        this.categoryForm.reset();
        this.success = 'Category added successfully';
        this.loading = false;
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        console.error('Error adding category:', err);
        console.error('Status:', err.status);
        console.error('Status Text:', err.statusText);
        console.error('Error body:', err.error);
        
        this.error = 'Failed to add category: ' + (err.error?.message || err.message || 'Unknown error');
        this.loading = false;
        setTimeout(() => this.error = null, 5000);
      }
    });
  }
  
  deleteCategory(id: number): void {
    // İşlevsiz buton olduğu için sadece konsola log yazacak
    console.log(`Delete category requested for ID: ${id}`);
    alert('Delete functionality will be implemented in the future.');
    
    /* 
    // İleride yapılacak gerçek silme işlemi:
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      this.loading = true;
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.categories = this.categories.filter(c => c.id !== id);
          this.success = 'Category deleted successfully';
          this.loading = false;
          setTimeout(() => this.success = null, 3000);
        },
        error: (err) => {
          this.error = 'Failed to delete category: ' + (err.error?.message || err.message || 'Unknown error');
          this.loading = false;
          console.error('Error deleting category:', err);
          setTimeout(() => this.error = null, 5000);
        }
      });
    }
    */
  }
} 