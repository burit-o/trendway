import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-add-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.scss']
})
export class AddProductModalComponent implements OnInit {
  @Output() saveProduct = new EventEmitter<Partial<Product> & { categoryId?: number }>();
  @Output() closeModal = new EventEmitter<void>();
  @Input() isVisible: boolean = false; // @Input dekoratörü eklendi

  productForm: FormGroup;
  categories: Category[] = []; // Kategori listesi (örneğin servisten alınacak)
  categoryError: string | null = null; // Kategori yükleme hatası için

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService // CategoryService inject edildi
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      stock: [null, [Validators.required, Validators.min(0)]],
      imageUrls: this.fb.array([this.fb.control('')]) // Başlangıçta bir resim URL alanı
    });
  }

  ngOnInit(): void {
    // Statik kategoriler kaldırıldı
    /*
    this.categories = [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Books' },
      { id: 3, name: 'Clothing' },
      { id: 4, name: 'Home & Kitchen' }
    ];
    */
    this.loadCategories(); // Kategorileri yükle
  }

  loadCategories(): void {
    this.categoryError = null;
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.categoryError = 'Failed to load categories. Please try again later.';
        // Hata durumunda formu kategori seçimi için devre dışı bırakabiliriz (opsiyonel)
        this.productForm.get('categoryId')?.disable(); 
      }
    });
  }

  get imageUrls(): FormArray {
    return this.productForm.get('imageUrls') as FormArray;
  }

  addImageUrlField(): void {
    this.imageUrls.push(this.fb.control(''));
  }

  removeImageUrlField(index: number): void {
    this.imageUrls.removeAt(index);
  }

  onSave(): void {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      // image_urls backend Product entity'sindeki gibi string[] olmalı.
      // Eğer formdan gelen imageUrls boş string içeriyorsa filtreleyelim.
      const filteredImageUrls = formValue.imageUrls.filter((url: string) => url && url.trim() !== '');
      
      // Product modeline uygun category nesnesi oluşturuluyor
      const productToSave: Partial<Product> & { categoryId?: number } = {
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
        categoryId: formValue.categoryId,
        stock: formValue.stock,
        imageUrls: filteredImageUrls.length > 0 ? filteredImageUrls : ['assets/placeholder.jpg'] // Boşsa placeholder
      };
      this.saveProduct.emit(productToSave);
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  // Modal dışına tıklama (opsiyonel, EditProductModal'dan alınabilir)
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
} 