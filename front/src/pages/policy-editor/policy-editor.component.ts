import { Component, viewChild } from '@angular/core';
import { sharedImports } from '../../shared/shared-imports';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LifePolicyPeriods, lifePolicyPeriodValues, policyTypes } from '../../data/data-model';
import { getPeriodLocalizedName, getTypeLocalizedName } from '../../data/localization-pipes';
import { PersonEditorControlComponent } from '../../shared/person-editor-control/person-editor-control.component';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-editor.component.html',
  imports: [sharedImports, PersonEditorControlComponent],
})
export class PolicyEditorComponent {
  public personEditorControlComponent = viewChild(PersonEditorControlComponent);

  public generalGroup = new FormGroup({
    series: new FormControl('', [Validators.required]),
    number: new FormControl('', [Validators.required]),
    startDate: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
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

  public save() {
    console.log(this.personEditorControlComponent()?.getSelectedPerson());
  }
}
