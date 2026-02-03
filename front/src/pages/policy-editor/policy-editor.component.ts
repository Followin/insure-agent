import { Component, viewChild } from '@angular/core';
import { sharedImports } from '../../shared/shared-imports';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LifePolicyPeriods, lifePolicyPeriodValues, policyTypes } from '../../data/data-model';
import { getPeriodLocalizedName, getTypeLocalizedName } from '../../data/localization-pipes';
import { PersonEditorControlComponent, PersonEditorValue } from '../../shared/person-editor-control/person-editor-control.component';
import { CarEditorControlComponent } from '../../shared/car-editor-control/car-editor-control.component';
import { CreatePolicyRequest } from './create-policy-request';
import { CreatePolicyService } from './create-policy-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-editor.component.html',
  imports: [sharedImports, PersonEditorControlComponent, CarEditorControlComponent],
})
export class PolicyEditorComponent {
  constructor(
    private createPolicyService: CreatePolicyService,
    private router: Router,
  ) { }

  public holderControl = new FormControl<PersonEditorValue>(null);
  public insuredControl = new FormControl<PersonEditorValue>(null);
  public greenCardCarEditorControlComponent = viewChild(CarEditorControlComponent);

  public generalGroup = new FormGroup({
    series: new FormControl('', [Validators.required]),
    number: new FormControl('', [Validators.required]),
    startDate: new FormControl<Date | null>(null, [Validators.required]),
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

  public peopleSearchItems: { name: string; code: number }[] = [];

  public policyTypes = policyTypes.map((x) => ({
    label: getTypeLocalizedName(x),
    value: x,
  }));

  public lifePolicyPeriods = lifePolicyPeriodValues.map((x) => ({
    label: getPeriodLocalizedName(x),
    value: x,
  }));

  private getPolicyRequest(): CreatePolicyRequest {
    const holder = this.holderControl.value!;
    const request = {
      series: this.generalGroup.controls.series.value!,
      number: this.generalGroup.controls.number.value!,
      holder,
      startDate: this.generalGroup.controls.startDate.value!,
      endDate: this.generalGroup.controls.startDate.value!,
      status: 'active',
    } as const;

    if (this.generalGroup.controls.type.value === 'life') {
      return {
        ...request,
        type: 'life',
        insured: this.insuredControl.value!,
        termYears: this.lifePolicyGroup.controls.termYears.value!,
        premium: this.lifePolicyGroup.controls.premium.value!,
        period: this.lifePolicyGroup.controls.period.value!,
      };
    } else if (this.generalGroup.controls.type.value === 'green-card') {
      return {
        ...request,
        type: 'green-card',
        car: this.greenCardCarEditorControlComponent()!.getSelectedCar(),
        territory: this.greenCardPolicyGroup.controls.territory.value!,
        termDays: this.greenCardPolicyGroup.controls.termDays.value!,
        premium: this.greenCardPolicyGroup.controls.premium.value!,
      };
    }

    throw new Error('Invalid type');
  }

  public save() {
    if (this.generalGroup.invalid) {
      this.generalGroup.markAllAsDirty();
      return;
    }

    if (this.generalGroup.controls.type.value === 'life') {
      if (this.lifePolicyGroup.invalid) {
        this.lifePolicyGroup.markAsTouched();
        return;
      }
    }

    if (this.generalGroup.controls.type.value === 'green-card') {
      if (this.greenCardPolicyGroup.invalid) {
        this.greenCardPolicyGroup.markAsTouched();
        return;
      }
    }

    const request = this.getPolicyRequest();
    this.createPolicyService.createPolicy(request);
    this.router.navigate(['/policies']);
  }
}
