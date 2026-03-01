import { Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { Popover, PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { DatepickerComponent } from '../../datepicker/datepicker.component';

export type DateRangeFilter = {
  from: string | null;
  to: string | null;
};

@Component({
  selector: 'app-table-filter-date',
  templateUrl: './app-table-filter-date.component.html',
  imports: [PopoverModule, ReactiveFormsModule, ButtonModule, DatepickerComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTableFilterDateComponent),
      multi: true,
    },
  ],
})
export class AppTableFilterDateComponent implements ControlValueAccessor {
  public target = input.required<HTMLElement>();
  public fromControl = new FormControl<string | null>(null);
  public toControl = new FormControl<string | null>(null);

  private onChange: (value: DateRangeFilter) => void = () => { };
  private onTouched: () => void = () => { };
  public isFiltered = signal(false);

  writeValue(value: DateRangeFilter): void {
    this.fromControl.setValue(value.from, { emitEvent: false });
    this.toControl.setValue(value.to, { emitEvent: false });

    if (value.from || value.to) {
      this.isFiltered.set(true);
    }
  }

  registerOnChange(fn: (value: DateRangeFilter) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  protected confirm(popover: Popover): void {
    if (!this.fromControl.value && !this.toControl.value) {
      return this.cancel(popover);
    }

    this.isFiltered.set(true);
    this.onChange({
      from: this.fromControl.value,
      to: this.toControl.value,
    });
    this.onTouched();
    popover.hide();
  }

  protected cancel(popover: Popover): void {
    this.isFiltered.set(false);
    this.onChange({
      from: null,
      to: null,
    });
    this.fromControl.setValue(null, { emitEvent: false });
    this.toControl.setValue(null, { emitEvent: false });
    this.onTouched();
    popover.hide();
  }
}
