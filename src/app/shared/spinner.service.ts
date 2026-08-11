import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  private loadingCount = 0;
  private readonly visibleSubject = new BehaviorSubject<boolean>(false);

  readonly visible$ = this.visibleSubject.asObservable();

  show(): void {
    this.loadingCount += 1;
    this.visibleSubject.next(true);
  }

  hide(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      this.visibleSubject.next(false);
    }
  }
}
