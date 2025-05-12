import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeItemStatusModalComponent } from './change-item-status-modal.component';

describe('ChangeItemStatusModalComponent', () => {
  let component: ChangeItemStatusModalComponent;
  let fixture: ComponentFixture<ChangeItemStatusModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeItemStatusModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeItemStatusModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
