import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-orders.component.html',
  // styleUrls: ['./seller-orders.component.scss']
})
export class SellerOrdersComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log('Seller Orders Component Initialized');
  }

} 