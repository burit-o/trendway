import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Order, OrderItem } from '../../models/order.model';

// Backend'deki OrderItemStatus enum'ının string karşılıkları
export const ORDER_ITEM_STATUSES = [
  'PREPARING',
  'SHIPPED',
  'DELIVERED'
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
    if (this.statusForm.valid && this.item.id) {
      this.saveStatus.emit({ 
        itemId: this.item.id, 
        newStatus: this.statusForm.value.newStatus 
      });
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
  
  // Sipariş durumlarını Türkçe'ye çeviren metod
  getStatusTranslation(status: string): string {
    switch (status) {
      case 'PREPARING': return 'HAZIRLANIYOR';
      case 'SHIPPED': return 'KARGODA';
      case 'DELIVERED': return 'TESLİM EDİLDİ';
      case 'CANCELLED': return 'İPTAL EDİLDİ';
      case 'REFUNDED': return 'İADE EDİLDİ';
      case 'EXCHANGE_REQUESTED': return 'DEĞİŞİM TALEBİ';
      case 'RETURNED': return 'İADE EDİLDİ';
      default: return status;
    }
  }
}
