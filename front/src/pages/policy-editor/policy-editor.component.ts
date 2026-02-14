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
import {
  policyTypeValues,
  PolicyType,
  policyStatusValues,
  PolicyStatus,
  carInsurancePeriodUnitValues,
  CarInsurancePeriodUnit,
  osagoZoneValues,
  OsagoZone,
} from '../../shared/models/policy.model';
import {
  getPolicyTypeLocalizedName,
  getPolicyStatusLocalizedName,
  getPeriodUnitLocalizedName,
  getOsagoZoneLocalizedName,
} from '../../shared/pipes/policy-localization.pipe';
import { CreatePolicyRequest, PolicyFull, UpdatePolicyRequest } from './policy.model';
import { PolicyEditorService } from './policy.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-editor.component.html',
  imports: [sharedImports, PersonEditorControlComponent, CarEditorControlComponent],
})
export class PolicyEditorComponent {
  private policyService = inject(PolicyEditorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public editMode = signal(false);
  public policyId = signal<number | null>(null);
  public loading = signal(false);

  public holderControl = new FormControl<PersonEditorValue>(null);
  public carControl = new FormControl<CarEditorValue>(null);

  public generalGroup = new FormGroup({
    series: new FormControl('', [Validators.required]),
    number: new FormControl('', [Validators.required]),
    startDate: new FormControl<Date | null>(null, [Validators.required]),
    endDate: new FormControl<Date | null>(null),
    type: new FormControl<PolicyType | null>(null, [Validators.required]),
    status: new FormControl<PolicyStatus>('Active', [Validators.required]),
  });

  public greenCardGroup = new FormGroup({
    territory: new FormControl('', [Validators.required]),
    period_in_units: new FormControl<number | null>(null, [Validators.required]),
    period_unit: new FormControl<CarInsurancePeriodUnit | null>(null, [Validators.required]),
    premium: new FormControl<number | null>(null, [Validators.required]),
  });

  public medassistanceGroup = new FormGroup({
    territory: new FormControl('', [Validators.required]),
    period_days: new FormControl<number | null>(null, [Validators.required]),
    premium: new FormControl<number | null>(null, [Validators.required]),
    payout: new FormControl<number | null>(null, [Validators.required]),
    program: new FormControl('', [Validators.required]),
  });

  public osagoGroup = new FormGroup({
    period_in_units: new FormControl<number | null>(null, [Validators.required]),
    period_unit: new FormControl<CarInsurancePeriodUnit | null>(null, [Validators.required]),
    zone: new FormControl<OsagoZone>('Zone1', [Validators.required]),
    exempt: new FormControl('Нет', [Validators.required]),
    premium: new FormControl<number | null>(null, [Validators.required]),
  });

  public membersArray = new FormArray<FormControl<PersonEditorValue>>([
    new FormControl<PersonEditorValue>(null),
  ]);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode.set(true);
      this.policyId.set(Number(id));
      this.loading.set(true);
      this.loadPolicy(Number(id));
    }

    this.generalGroup.controls.type.valueChanges.subscribe(() => {
      if (this.generalGroup.controls.type.value === 'Osago') {
        this.generalGroup.controls.series.setValue('ЕР');
      }
    });
  }

  private loadPolicy(id: number) {
    this.policyService.getById(id).subscribe({
      next: (policy) => {
        this.populateForm(policy);
        this.loading.set(false);
      },
      error: () => {
        this.router.navigate(['/policies']);
      },
    });
  }

  private populateForm(policy: PolicyFull) {
    this.generalGroup.controls.series.setValue(policy.series);
    this.generalGroup.controls.number.setValue(policy.number);
    this.generalGroup.controls.startDate.setValue(new Date(policy.start_date));
    this.generalGroup.controls.endDate.setValue(policy.end_date ? new Date(policy.end_date) : null);
    this.generalGroup.controls.type.setValue(policy.policy_type);
    this.generalGroup.controls.status.setValue(policy.status);

    // Disable type change in edit mode
    this.generalGroup.controls.type.disable();

    this.holderControl.setValue({ kind: 'Existing', id: policy.holder.id });

    if (policy.policy_type === 'GreenCard') {
      this.greenCardGroup.controls.territory.setValue(policy.territory);
      this.greenCardGroup.controls.period_in_units.setValue(policy.period_in_units);
      this.greenCardGroup.controls.period_unit.setValue(policy.period_unit);
      this.greenCardGroup.controls.premium.setValue(policy.premium);
      this.carControl.setValue({ kind: 'Existing', id: policy.car.id });
    } else if (policy.policy_type === 'Medassistance') {
      this.medassistanceGroup.controls.territory.setValue(policy.territory);
      this.medassistanceGroup.controls.period_days.setValue(policy.period_days);
      this.medassistanceGroup.controls.premium.setValue(policy.premium);
      this.medassistanceGroup.controls.payout.setValue(policy.payout);
      this.medassistanceGroup.controls.program.setValue(policy.program);

      this.membersArray.clear();
      for (const member of policy.members) {
        this.membersArray.push(
          new FormControl<PersonEditorValue>({ kind: 'Existing', id: member.id }),
        );
      }
    } else if (policy.policy_type === 'Osago') {
      this.osagoGroup.controls.period_in_units.setValue(policy.period_in_units);
      this.osagoGroup.controls.period_unit.setValue(policy.period_unit);
      this.osagoGroup.controls.zone.setValue(policy.zone);
      this.osagoGroup.controls.exempt.setValue(policy.exempt);
      this.osagoGroup.controls.premium.setValue(policy.premium);
      this.carControl.setValue({ kind: 'Existing', id: policy.car.id });
    }
  }

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

  public policyStatuses = policyStatusValues.map((x) => ({
    label: getPolicyStatusLocalizedName(x),
    value: x,
  }));

  public periodUnits = carInsurancePeriodUnitValues.map((x) => ({
    label: getPeriodUnitLocalizedName(x),
    value: x,
  }));

  public osagoZones = osagoZoneValues.map((x) => ({
    label: getOsagoZoneLocalizedName(x),
    value: x,
  }));

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getPolicyRequest(): CreatePolicyRequest | UpdatePolicyRequest {
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

    const statusBase = this.editMode() ? { status: this.generalGroup.controls.status.value! } : {};

    // Use getRawValue to get the value even if disabled
    const policyType = this.generalGroup.controls.type.getRawValue();

    if (policyType === 'GreenCard') {
      return {
        ...base,
        ...statusBase,
        policy_type: 'GreenCard',
        territory: this.greenCardGroup.controls.territory.value!,
        period_in_units: this.greenCardGroup.controls.period_in_units.value!,
        period_unit: this.greenCardGroup.controls.period_unit.value!,
        premium: this.greenCardGroup.controls.premium.value!,
        car: this.carControl.value!,
      };
    } else if (policyType === 'Medassistance') {
      const members = this.membersArray.controls
        .map((c) => c.value)
        .filter((m): m is NonNullable<PersonEditorValue> => m !== null);
      return {
        ...base,
        ...statusBase,
        policy_type: 'Medassistance',
        territory: this.medassistanceGroup.controls.territory.value!,
        period_days: this.medassistanceGroup.controls.period_days.value!,
        premium: this.medassistanceGroup.controls.premium.value!,
        payout: this.medassistanceGroup.controls.payout.value!,
        program: this.medassistanceGroup.controls.program.value!,
        members,
      };
    } else if (policyType === 'Osago') {
      return {
        ...base,
        ...statusBase,
        policy_type: 'Osago',
        period_in_units: this.osagoGroup.controls.period_in_units.value!,
        period_unit: this.osagoGroup.controls.period_unit.value!,
        zone: this.osagoGroup.controls.zone.value!,
        exempt: this.osagoGroup.controls.exempt.value!,
        premium: this.osagoGroup.controls.premium.value!,
        car: this.carControl.value!,
      };
    }

    throw new Error('Invalid policy type');
  }

  public save() {
    if (this.generalGroup.invalid) {
      this.generalGroup.markAllAsTouched();
      return;
    }

    const policyType = this.generalGroup.controls.type.getRawValue();

    if (policyType === 'GreenCard' && this.greenCardGroup.invalid) {
      this.greenCardGroup.markAllAsTouched();
      return;
    }

    if (policyType === 'Medassistance' && this.medassistanceGroup.invalid) {
      this.medassistanceGroup.markAllAsTouched();
      return;
    }

    if (policyType === 'Osago' && this.osagoGroup.invalid) {
      this.osagoGroup.markAllAsTouched();
      return;
    }

    const request = this.getPolicyRequest();

    if (this.editMode() && this.policyId()) {
      this.policyService.update(this.policyId()!, request as UpdatePolicyRequest).subscribe(() => {
        this.router.navigate(['/policies', this.policyId()]);
      });
    } else {
      this.policyService.create(request as CreatePolicyRequest).subscribe(() => {
        this.router.navigate(['/policies']);
      });
    }
  }
}
