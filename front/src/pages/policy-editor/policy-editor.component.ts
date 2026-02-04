import { Component, inject, signal } from '@angular/core';
import { sharedImports } from '../../shared/shared-imports';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  PersonEditorControlComponent,
  PersonEditorValue,
} from '../../shared/person-editor-control/person-editor-control.component';
import {
  CarEditorControlComponent,
  CarEditorValue,
} from '../../shared/car-editor-control/car-editor-control.component';
import { policyTypeValues, PolicyType } from '../../shared/models/policy.model';
import { getPolicyTypeLocalizedName } from '../../shared/pipes/policy-localization.pipe';
import { CreatePolicyRequest } from './policy.model';
import { PolicyEditorService } from './policy.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-editor.component.html',
  imports: [sharedImports, PersonEditorControlComponent, CarEditorControlComponent],
})
export class PolicyEditorComponent {
  private policyService = inject(PolicyEditorService);
  private router = inject(Router);

  public holderControl = new FormControl<PersonEditorValue>(null);
  public carControl = new FormControl<CarEditorValue>(null);

  public generalGroup = new FormGroup({
    series: new FormControl('', [Validators.required]),
    number: new FormControl('', [Validators.required]),
    startDate: new FormControl<Date | null>(null, [Validators.required]),
    endDate: new FormControl<Date | null>(null),
    type: new FormControl<PolicyType | null>(null, [Validators.required]),
  });

  public greenCardGroup = new FormGroup({
    territory: new FormControl('', [Validators.required]),
    period_months: new FormControl<number | null>(null, [Validators.required]),
    premium: new FormControl<number | null>(null, [Validators.required]),
  });

  public medassistanceGroup = new FormGroup({
    territory: new FormControl('', [Validators.required]),
    period_months: new FormControl<number | null>(null, [Validators.required]),
    premium: new FormControl<number | null>(null, [Validators.required]),
    payout: new FormControl<number | null>(null, [Validators.required]),
    program: new FormControl('', [Validators.required]),
  });

  public membersArray = new FormArray<FormControl<PersonEditorValue>>([
    new FormControl<PersonEditorValue>(null),
  ]);

  public addMember() {
    this.membersArray.push(new FormControl<PersonEditorValue>(null));
  }

  public removeMember(index: number) {
    if (this.membersArray.length > 1) {
      this.membersArray.removeAt(index);
    }
  }

  public policyTypes = policyTypeValues.map((x) => ({
    label: getPolicyTypeLocalizedName(x),
    value: x,
  }));

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getPolicyRequest(): CreatePolicyRequest {
    const holder = this.holderControl.value!;
    const base = {
      series: this.generalGroup.controls.series.value!,
      number: this.generalGroup.controls.number.value!,
      holder,
      start_date: this.formatDate(this.generalGroup.controls.startDate.value!),
      end_date: this.generalGroup.controls.endDate.value
        ? this.formatDate(this.generalGroup.controls.endDate.value)
        : null,
    };

    const policyType = this.generalGroup.controls.type.value;

    if (policyType === 'GreenCard') {
      return {
        ...base,
        policy_type: 'GreenCard',
        territory: this.greenCardGroup.controls.territory.value!,
        period_months: this.greenCardGroup.controls.period_months.value!,
        premium: this.greenCardGroup.controls.premium.value!,
        car: this.carControl.value!,
      };
    } else if (policyType === 'Medassistance') {
      const members = this.membersArray.controls
        .map((c) => c.value)
        .filter((m): m is NonNullable<PersonEditorValue> => m !== null);
      return {
        ...base,
        policy_type: 'Medassistance',
        territory: this.medassistanceGroup.controls.territory.value!,
        period_months: this.medassistanceGroup.controls.period_months.value!,
        premium: this.medassistanceGroup.controls.premium.value!,
        payout: this.medassistanceGroup.controls.payout.value!,
        program: this.medassistanceGroup.controls.program.value!,
        members,
      };
    } else if (policyType === 'Osago') {
      return {
        ...base,
        policy_type: 'Osago',
      };
    }

    throw new Error('Invalid policy type');
  }

  public save() {
    if (this.generalGroup.invalid) {
      this.generalGroup.markAllAsTouched();
      return;
    }

    const policyType = this.generalGroup.controls.type.value;

    if (policyType === 'GreenCard' && this.greenCardGroup.invalid) {
      this.greenCardGroup.markAllAsTouched();
      return;
    }

    if (policyType === 'Medassistance' && this.medassistanceGroup.invalid) {
      this.medassistanceGroup.markAllAsTouched();
      return;
    }

    const request = this.getPolicyRequest();
    this.policyService.create(request).subscribe(() => {
      this.router.navigate(['/policies']);
    });
  }
}
