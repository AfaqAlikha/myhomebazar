import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiSearchComponent } from './ui-search.component';

describe('UiSearchComponent', () => {
  let component: UiSearchComponent;
  let fixture: ComponentFixture<UiSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UiSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
