import { Component } from '@angular/core';
import { sharedImports } from '../../shared/shared-imports';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { people } from '../../data/data';
import { LifePolicyPeriods, lifePolicyPeriodValues, policyTypes } from '../../data/data-model';
import { getPeriodLocalizedName, getTypeLocalizedName } from '../../data/localization-pipes';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-editor.component.html',
  imports: [sharedImports],
})
export class PolicyEditorComponent {
  public generalGroup = new FormGroup({
    series: new FormControl('', [Validators.required]),
    number: new FormControl('', [Validators.required]),
    startDate: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
  });

  public holderIdControl = new FormControl<number | undefined>(undefined, [Validators.required]);

  public holderGroup = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    phone: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    birthDate: new FormControl<Date | null>(null, [Validators.required]),
  });

  public lifePolicyGroup = new FormGroup({
    termYears: new FormControl<number | null>(null, [Validators.required]),
    premium: new FormControl<number | null>(null, [Validators.required]),
    period: new FormControl<LifePolicyPeriods>('annual', [Validators.required]),
  });

  public greenCardPolicyGroup = new FormGroup({
    territory: new FormControl<string>('', [Validators.required]),
    termDays: new FormControl<number | null>(null, [Validators.required]),
    premium: new FormControl<number | null>(null, [Validators.required]),
  });

  public greenCardCarGroup = new FormGroup({
    make: new FormControl<string>('', [Validators.required]),
    model: new FormControl<string>('', [Validators.required]),
    year: new FormControl<number | null>(null, [Validators.required]),
    vin: new FormControl<string>('', [Validators.required]),
    plate: new FormControl<string>('', [Validators.required]),
    chassis: new FormControl<string>('', [Validators.required]),
    type: new FormControl<string>('', [Validators.required]),
    registration: new FormControl<string>('', [Validators.required]),
    mileageKm: new FormControl<number | null>(null, [Validators.required]),
  });

  public peopleSearchItems: { name: string; code: number }[] = [];

  public policyTypes = policyTypes.map((x) => ({
    label: getTypeLocalizedName(x),
    value: x,
  }));

  public lifePolicyPeriods = lifePolicyPeriodValues.map((x) => ({
    label: getPeriodLocalizedName(x),
    value: x,
  }));

  constructor() {
    this.holderIdControl.valueChanges.subscribe((value) => {
      if (!value) {
        this.holderGroup.reset();
        this.holderGroup.enable();
        return;
      }

      const person = people.find((x) => x.id === value)!;

      this.holderGroup.disable();
      this.holderGroup.setValue({
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        phone: person.phone,
        address: person.address,
        birthDate: person.birthDate,
      });
    });
  }

  public search($event: AutoCompleteCompleteEvent) {
    this.peopleSearchItems = people
      .map((x) => ({ name: x.firstName + ' ' + x.lastName, code: x.id }))
      .filter((item) => item.name.toLowerCase().includes($event.query.toLowerCase()));
  }
}
