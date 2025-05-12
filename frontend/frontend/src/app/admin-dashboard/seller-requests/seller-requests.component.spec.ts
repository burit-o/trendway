import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerRequestsComponent } from './seller-requests.component';

describe('SellerRequestsComponent', () => {
  let component: SellerRequestsComponent;
  let fixture: ComponentFixture<SellerRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SellerRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
