import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiPasswordComponent } from './ui-password.component';

describe('UiPasswordComponent', () => {
  let component: UiPasswordComponent;
  let fixture: ComponentFixture<UiPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiPasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UiPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
