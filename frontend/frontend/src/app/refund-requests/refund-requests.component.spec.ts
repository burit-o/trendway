import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundRequestsComponent } from './refund-requests.component';

describe('RefundRequestsComponent', () => {
  let component: RefundRequestsComponent;
  let fixture: ComponentFixture<RefundRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
