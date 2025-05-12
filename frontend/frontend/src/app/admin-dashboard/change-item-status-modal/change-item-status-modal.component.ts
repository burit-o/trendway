import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './change-item-status-modal.component.html',
  styleUrls: ['./change-item-status-modal.component.scss']
})
export class ChangeItemStatusModalComponent implements OnInit {
  @Input() order!: Order;
  @Input() item!: OrderItem;
  @Input() isVisible: boolean = false;

  @Output() saveStatus = new EventEmitter<{ itemId: number, newStatus: string }>();
  @Output() closeModal = new EventEmitter<void>();

  availableStatuses: string[] = ORDER_ITEM_STATUSES;
  newStatus: string = '';

  constructor() {}

  ngOnInit(): void {
    if (this.item) {
      this.newStatus = this.item.status;
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
  
  onSave(): void {
    console.log('Save button clicked. New status:', this.newStatus);
    console.log('Item ID:', this.item?.id);
    
    if (this.newStatus && this.item && this.item.id && this.newStatus !== this.item.status) {
      const payload = { 
        itemId: this.item.id, 
        newStatus: this.newStatus
      };
      
      console.log('Emitting saveStatus event with payload:', payload);
      this.saveStatus.emit(payload);
    } else {
      console.error('Cannot save: New status is empty, item is missing, item ID is missing, or status has not changed.', {
        newStatus: this.newStatus,
        itemExists: !!this.item,
        itemId: this.item?.id,
        statusChanged: this.newStatus !== this.item?.status
      });
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
