import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms'; // FormArray eklendi
import { Product } from '../../models/product.model';

declare var bootstrap: any; // Bootstrap JavaScript'i için global değişken

@Component({
  selector: 'app-edit-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-product-modal.component.html',
  // styleUrls: ['./edit-product-modal.component.scss']
})
export class EditProductModalComponent implements OnInit, OnChanges {
  @Input() product: Product | null = null;
  @Input() isVisible: boolean = false;
  @Output() saveProduct = new EventEmitter<Partial<Product>>();
  @Output() closeModal = new EventEmitter<void>();

  editProductForm: FormGroup;
  private modalInstance: any;

  constructor(private fb: FormBuilder) {
    this.editProductForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      imageUrls: this.fb.array([this.fb.control('')]), // Şimdilik ilk görsel
      active: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    const modalElement = document.getElementById('editProductModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement, {
        keyboard: false,
        backdrop: 'static'
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.editProductForm.patchValue({
        id: this.product.id,
        name: this.product.name,
        description: this.product.description,
        price: this.product.price,
        active: this.product.active
      });
      const imageUrlsFormArray = this.editProductForm.get('imageUrls') as FormArray;
      if (this.product.imageUrls && this.product.imageUrls.length > 0) {
        imageUrlsFormArray.at(0).setValue(this.product.imageUrls[0]);
      } else {
        imageUrlsFormArray.at(0).setValue('');
      }
    }

    if (changes['isVisible'] && this.modalInstance) {
      if (this.isVisible) {
        this.modalInstance.show();
      } else {
        this.modalInstance.hide();
      }
    }
  }
  
  get imageUrlsArray() {
    return this.editProductForm.get('imageUrls') as FormArray;
  }

  onSave(): void {
    if (this.editProductForm.valid) {
      const formValue = this.editProductForm.value;
      const productDataToSave: Partial<Product> = {
        id: formValue.id,
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
        imageUrls: [formValue.imageUrls[0] || ''],
        active: formValue.active,
      };
      this.saveProduct.emit(productDataToSave);
    } else {
      this.editProductForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.closeModal.emit();
  }
} 