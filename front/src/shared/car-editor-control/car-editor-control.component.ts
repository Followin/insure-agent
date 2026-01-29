import { booleanAttribute, Component, input } from '@angular/core';
import { sharedImports } from '../shared-imports';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { CarSearchService } from './car-search.service';
import { Car } from '../../data/data-model';

export type ExistingCar = {
  type: 'existing';
  id: number;
};

export type NewCar = {
  type: 'new';
  car: Omit<Car, 'id'>;
};

@Component({
  selector: 'app-car-editor',
  templateUrl: './car-editor-control.component.html',
  imports: [sharedImports],
})
export class CarEditorControlComponent {
  public readonly allowExisting = input(false, { transform: booleanAttribute });
  public readonly header = input('Автомобиль');

  public existingCarIdControl = new FormControl<number | null>(null);

  public carGroup = new FormGroup({
    make: new FormControl('', [Validators.required]),
    model: new FormControl('', [Validators.required]),
    year: new FormControl<number | null>(null, [Validators.required]),
    vin: new FormControl('', [Validators.required]),
    plate: new FormControl('', [Validators.required]),
    chassis: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
    registration: new FormControl('', [Validators.required]),
    mileageKm: new FormControl<number | null>(null, [Validators.required]),
  });

  public carSearchSuggestions: AutocompleteSugggestion<number>[] = [];

  constructor(private carSearchService: CarSearchService) {
    this.existingCarIdControl.valueChanges.subscribe((id) => {
      if (!id || !Number.isInteger(id)) {
        this.carGroup.reset();
        this.carGroup.enable();
        return;
      }

      this.carSearchService.getCar(id).subscribe((car) => {
        if (!car) {
          throw new Error(`Car with id ${id} not found`);
        }

        this.carGroup.controls.make.setValue(car.make);
        this.carGroup.controls.model.setValue(car.model);
        this.carGroup.controls.year.setValue(car.year);
        this.carGroup.controls.vin.setValue(car.vin);
        this.carGroup.controls.plate.setValue(car.plate);
        this.carGroup.controls.chassis.setValue(car.chassis);
        this.carGroup.controls.type.setValue(car.type);
        this.carGroup.controls.registration.setValue(car.registration);
        this.carGroup.controls.mileageKm.setValue(car.mileageKm);

        this.carGroup.disable();
      });
    });
  }

  public search($event: AutoCompleteCompleteEvent) {
    this.carSearchService.search($event.query).subscribe((cars) => {
      this.carSearchSuggestions = cars;
    });
  }

  public getSelectedCar(): ExistingCar | NewCar {
    if (this.existingCarIdControl.value) {
      return {
        type: 'existing',
        id: this.existingCarIdControl.value,
      };
    }

    if (this.carGroup.valid) {
      return {
        type: 'new',
        car: {
          make: this.carGroup.controls.make.value!,
          model: this.carGroup.controls.model.value!,
          year: this.carGroup.controls.year.value!,
          vin: this.carGroup.controls.vin.value!,
          plate: this.carGroup.controls.plate.value!,
          chassis: this.carGroup.controls.chassis.value!,
          type: this.carGroup.controls.type.value!,
          registration: this.carGroup.controls.registration.value!,
          mileageKm: this.carGroup.controls.mileageKm.value!,
        },
      };
    }

    throw new Error('Invalid state');
  }
}
