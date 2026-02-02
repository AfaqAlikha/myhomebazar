import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentSuccessCartComponent } from './payment-success-cart.component';

describe('PaymentSuccessCartComponent', () => {
  let component: PaymentSuccessCartComponent;
  let fixture: ComponentFixture<PaymentSuccessCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentSuccessCartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentSuccessCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
