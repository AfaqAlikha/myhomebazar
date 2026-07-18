import {
  Component,
  Input,
  forwardRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true,
    },
  ],
})
export class StarRatingComponent implements ControlValueAccessor {
  @Input() readonly = false;
  @Input() showValue = true;
  @Input() size: 'sm' | 'md' = 'md';

  @Input() set value(val: number | null) {
    this.valueSignal.set(Number(val) || 0);
  }

  private valueSignal = signal(0);
  disabled = false;

  displayValue = computed(() => {
    const val = this.valueSignal();
    return val > 0 ? val.toFixed(1) : '0.0';
  });

  stars = [1, 2, 3, 4, 5];

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.valueSignal.set(Number(value) || 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  getStarIcon(starIndex: number): string {
    const rating = this.valueSignal();
    if (rating >= starIndex) return 'star';
    if (rating >= starIndex - 0.5) return 'star_half';
    return 'star_border';
  }

  isStarFilled(starIndex: number): boolean {
    const rating = this.valueSignal();
    return rating >= starIndex - 0.5;
  }

  onStarClick(event: MouseEvent, starIndex: number): void {
    if (this.readonly || this.disabled) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const isLeftHalf = event.clientX - rect.left < rect.width / 2;
    const nextValue = isLeftHalf ? starIndex - 0.5 : starIndex;

    this.valueSignal.set(nextValue);
    this.onChange(nextValue);
    this.onTouched();
  }
}
