import { Component, forwardRef, input } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [DatePickerModule, ReactiveFormsModule],
  template: `
    <p-datepicker
      [formControl]="dateControl"
      [inputId]="id()"
      dateFormat="dd/mm/yy"
      showIcon
      fluid
    ></p-datepicker>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true,
    },
  ],
})
export class DatepickerComponent implements ControlValueAccessor {
  public readonly id = input<string>('');

  public dateControl = new FormControl<Date | null>(null);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.dateControl.valueChanges.subscribe((date) => {
      if (date) {
        this.onChange(this.formatDate(date));
      } else {
        this.onChange(null);
      }
      this.onTouched();
    });
  }

  writeValue(value: string | null): void {
    if (value) {
      this.dateControl.setValue(new Date(value), { emitEvent: false });
    } else {
      this.dateControl.setValue(null, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.dateControl.disable({ emitEvent: false });
    } else {
      this.dateControl.enable({ emitEvent: false });
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
