import { Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { Popover, PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-table-filter-text',
  templateUrl: './app-table-filter-text.component.html',
  imports: [PopoverModule, ReactiveFormsModule, ButtonModule, InputTextModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTableFilterTextComponent),
      multi: true,
    },
  ],
})
export class AppTableFilterTextComponent implements ControlValueAccessor {
  public target = input.required<HTMLElement>();
  public formControl = new FormControl<string>('');

  public isFiltered = signal(false);

  private onChange: (value: string | null) => void = () => { };
  private onTouched: () => void = () => { };

  writeValue(value: string): void {
    this.formControl.setValue(value ?? '');
    if (value) {
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
    console.log(this.formControl.value);
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
