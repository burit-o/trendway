import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Order, OrderItem } from '../../models/order.model';

// Backend'deki OrderItemStatus enum'ının string karşılıkları
export const ORDER_ITEM_STATUSES = [
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'REFUNDED',
  'EXCHANGED',
  'CANCELLED_BY_ADMIN'
];

@Component({
  selector: 'app-change-item-status-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-item-status-modal.component.html',
  styleUrls: ['./change-item-status-modal.component.scss']
})
export class ChangeItemStatusModalComponent implements OnInit {
  @Input() order!: Order;
  @Input() item!: OrderItem;
  @Input() isVisible: boolean = false;

  @Output() saveStatus = new EventEmitter<{ itemId: number, newStatus: string }>();
  @Output() closeModal = new EventEmitter<void>();

  statusForm: FormGroup;
  statusOptions: string[] = ORDER_ITEM_STATUSES;

  constructor(private fb: FormBuilder) {
    this.statusForm = this.fb.group({
      newStatus: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.item) {
      this.statusForm.patchValue({ newStatus: this.item.status });
    }
  }

  // Modal dışına tıklandığında kapatmak için
  onBackdropClick(event: MouseEvent): void {
    // Sadece backdrop'a tıklandıysa kapat (modal içeriği değil)
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
  
  onSubmit(): void {
    console.log('Form submitted:', this.statusForm);
    console.log('Form validity:', this.statusForm.valid);
    console.log('Form value:', this.statusForm.value);
    console.log('Item ID:', this.item?.id);
    
    if (this.statusForm.valid && this.item && this.item.id) {
      const payload = { 
        itemId: this.item.id, 
        newStatus: this.statusForm.value.newStatus 
      };
      
      console.log('Emitting saveStatus event with payload:', payload);
      this.saveStatus.emit(payload);
    } else {
      console.error('Form is invalid or item is missing ID:', {
        formValid: this.statusForm.valid,
        itemExists: !!this.item,
        itemId: this.item?.id
      });
      
      if (this.statusForm.invalid) {
        Object.keys(this.statusForm.controls).forEach(key => {
          const control = this.statusForm.get(key);
          console.error(`Control ${key} errors:`, control?.errors);
        });
      }
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
