import { booleanAttribute, Component, forwardRef, input, signal, viewChild } from '@angular/core';
import { AutoComplete } from 'primeng/autocomplete';
import { sharedImports } from '../shared-imports';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { CarSearchService } from './car-search.service';
import { CarRef } from '../models/car.model';

export type CarEditorValue = CarRef | null;

@Component({
  selector: 'app-car-editor-control',
  templateUrl: './car-editor-control.component.html',
  imports: [sharedImports],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CarEditorControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CarEditorControlComponent),
      multi: true,
    },
  ],
})
export class CarEditorControlComponent implements ControlValueAccessor, Validator {
  public readonly allowExisting = input(false, { transform: booleanAttribute });
  public readonly header = input('Автомобиль');

  private autocomplete = viewChild<AutoComplete>('existingCarAutocomplete');

  public existingCarIdControl = new FormControl<number | null>(null);

  public carGroup = new FormGroup({
    chassis: new FormControl('', [Validators.required]),
    make: new FormControl('', [Validators.required]),
    model: new FormControl('', [Validators.required]),
    registration: new FormControl('', [Validators.required]),
    plate: new FormControl('', [Validators.required]),
    year: new FormControl<number | null>(null, [Validators.required]),
    engine_displacement_litres: new FormControl<number | null>(null, [Validators.required]),
    mileage_km: new FormControl<number | null>(null, [Validators.required]),
    unladen_weight: new FormControl<number | null>(null, [Validators.required]),
    laden_weight: new FormControl<number | null>(null, [Validators.required]),
    seats: new FormControl<number | null>(null, [Validators.required]),
  });

  public carSearchSuggestions = signal<AutocompleteSugggestion<number>[]>([]);

  private onChange: (value: CarEditorValue) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private carSearchService: CarSearchService) {
    this.carGroup.valueChanges.subscribe(() => this.emitValue());

    this.existingCarIdControl.valueChanges.subscribe((id) => {
      if (!id || !Number.isInteger(id)) {
        this.carGroup.reset();
        this.carGroup.enable();
        this.emitValue();
        return;
      }

      this.carSearchService.getCar(id).subscribe((car) => {
        if (!car) {
          throw new Error(`Car with id ${id} not found`);
        }

        const autocomplete = this.autocomplete();
        if (this.carSearchSuggestions.length == 0 && autocomplete?.inputEL) {
          // initial load
          autocomplete.inputEL.nativeElement.value = `${car.make} ${car.model} (${car.plate})`;
        }

        this.carGroup.controls.chassis.setValue(car.chassis);
        this.carGroup.controls.make.setValue(car.make);
        this.carGroup.controls.model.setValue(car.model);
        this.carGroup.controls.registration.setValue(car.registration);
        this.carGroup.controls.plate.setValue(car.plate);
        this.carGroup.controls.year.setValue(car.year);
        this.carGroup.controls.engine_displacement_litres.setValue(car.engine_displacement_litres);
        this.carGroup.controls.mileage_km.setValue(car.mileage_km);
        this.carGroup.controls.unladen_weight.setValue(car.unladen_weight);
        this.carGroup.controls.laden_weight.setValue(car.laden_weight);
        this.carGroup.controls.seats.setValue(car.seats);

        this.carGroup.disable();
        this.emitValue();
      });
    });
  }

  writeValue(value: CarEditorValue): void {
    if (!value) {
      this.existingCarIdControl.reset();
      this.carGroup.reset();
      return;
    }

    if (value.kind === 'Existing') {
      this.existingCarIdControl.setValue(value.id);
    } else {
      this.carGroup.controls.chassis.setValue(value.chassis);
      this.carGroup.controls.make.setValue(value.make);
      this.carGroup.controls.model.setValue(value.model);
      this.carGroup.controls.registration.setValue(value.registration);
      this.carGroup.controls.plate.setValue(value.plate);
      this.carGroup.controls.year.setValue(value.year);
      this.carGroup.controls.engine_displacement_litres.setValue(value.engine_displacement_litres);
      this.carGroup.controls.mileage_km.setValue(value.mileage_km);
      this.carGroup.controls.unladen_weight.setValue(value.unladen_weight);
      this.carGroup.controls.laden_weight.setValue(value.laden_weight);
      this.carGroup.controls.seats.setValue(value.seats);
    }
  }

  registerOnChange(fn: (value: CarEditorValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    if (this.existingCarIdControl.value) {
      return null;
    }
    return this.carGroup.valid ? null : { invalid: true };
  }

  public search($event: AutoCompleteCompleteEvent) {
    this.carSearchService.search($event.query).subscribe((cars) => {
      this.carSearchSuggestions.set(cars);
    });
  }

  private emitValue(): void {
    if (this.existingCarIdControl.value) {
      this.onChange({
        kind: 'Existing',
        id: this.existingCarIdControl.value,
      });
      return;
    }

    if (this.carGroup.valid) {
      const v = this.carGroup.value;
      this.onChange({
        kind: 'New',
        chassis: v.chassis!,
        make: v.make!,
        model: v.model!,
        registration: v.registration!,
        plate: v.plate!,
        year: v.year!,
        engine_displacement_litres: v.engine_displacement_litres!,
        mileage_km: v.mileage_km!,
        unladen_weight: v.unladen_weight!,
        laden_weight: v.laden_weight!,
        seats: v.seats!,
      });
    } else {
      this.onChange(null);
    }

    this.onTouched();
  }
}
