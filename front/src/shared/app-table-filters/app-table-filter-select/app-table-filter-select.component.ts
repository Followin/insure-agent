import { Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { Popover, PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-table-filter-select',
  templateUrl: './app-table-filter-select.component.html',
  imports: [PopoverModule, ReactiveFormsModule, ButtonModule, MultiSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTableFilterSelectComponent),
      multi: true,
    },
  ],
})
export class AppTableFilterSelectComponent<T> implements ControlValueAccessor {
  public target = input.required<HTMLElement>();
  public options = input.required<SelectOption<T>[]>();
  public formControl = new FormControl<string>('');

  private onChange: (value: string | null) => void = () => { };
  private onTouched: () => void = () => { };
  public isFiltered = signal(false);

  writeValue(value: string): void {
    this.formControl.setValue(value ?? '');
    if (value?.length) {
      this.isFiltered.set(true);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  protected confirm(popover: Popover): void {
    if (!this.formControl.value) {
      return this.cancel(popover);
    }

    this.isFiltered.set(true);
    this.onChange(this.formControl.value);
    this.onTouched();
    popover.hide();
  }

  protected cancel(popover: Popover): void {
    this.isFiltered.set(false);
    this.onChange(null);
    this.formControl.setValue('');
    this.onTouched();
    popover.hide();
  }
}
