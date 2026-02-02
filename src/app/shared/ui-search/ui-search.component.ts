import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-search',
  templateUrl: './ui-search.component.html',
  styleUrls: ['./ui-search.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSearchComponent),
      multi: true,
    },
  ],
})
export class UiSearchComponent implements ControlValueAccessor {
  @Input() label = 'Search';
  @Output() search = new EventEmitter<string>();

  value = '';
  disabled = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(obj: any): void {
    this.value = obj ?? '';
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  onInput(value: string) {
    this.value = value;
    this.onChange(value);
  }

  onSearchClick() {
    this.search.emit(this.value);
  }

  onEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.search.emit(this.value);
    }
  }
}
