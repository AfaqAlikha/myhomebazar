import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  private activeCount = 0;

  constructor(private spinner: NgxSpinnerService) {}

  show(): void {
    if (this.activeCount === 0) {
      this.spinner.show();
    }
    this.activeCount += 1;
  }

  hide(): void {
    if (this.activeCount <= 0) {
      this.activeCount = 0;
      return;
    }

    this.activeCount -= 1;
    if (this.activeCount === 0) {
      this.spinner.hide();
    }
  }

  forceHide(): void {
    this.activeCount = 0;
    this.spinner.hide();
  }
}
