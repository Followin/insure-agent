import { Component, booleanAttribute, input, output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { sharedImports } from '../shared-imports';
import {
  PolicyShort,
  PolicyStatus,
  policyStatusValues,
  PolicyType,
  policyTypeValues,
} from '../models/policy.model';
import { DateRangeFilter } from '../app-table-filters/app-table-filter-date/app-table-filter-date.component';
import {
  getPolicyStatusLocalizedName,
  getPolicyTypeLocalizedName,
} from '../pipes/policy-localization.pipe';

export interface PolicyTableFilter {
  number: string | null;
  holder: string | null;
  car: string | null;
  startDate: DateRangeFilter;
  endDate: DateRangeFilter;
  policyTypes: PolicyType[];
  statuses: PolicyStatus[];
}

@Component({
  selector: 'app-policy-table',
  templateUrl: './policy-table.component.html',
  imports: [sharedImports],
})
export class PolicyTableComponent {
  public policies = input.required<PolicyShort[]>();
  public loading = input(false, { transform: booleanAttribute });
  public showHolderColumn = input(true, { transform: booleanAttribute });

  public initialFilter = input<PolicyTableFilter>({
    number: null,
    holder: null,
    car: null,
    startDate: { from: null, to: null },
    endDate: { from: null, to: null },
    policyTypes: [],
    statuses: [],
  });
  public filterChange = output<PolicyTableFilter>();

  public policyTypes = policyTypeValues.map((x) => ({
    label: getPolicyTypeLocalizedName(x),
    value: x,
  }));

  public policyStatuses = policyStatusValues.map((x) => ({
    label: getPolicyStatusLocalizedName(x),
    value: x,
  }));

  public filterForm = new FormGroup({
    number: new FormControl<string | null>(null),
    holder: new FormControl<string | null>(null),
    car: new FormControl<string | null>(null),
    startDate: new FormControl<DateRangeFilter>({ from: null, to: null }),
    endDate: new FormControl<DateRangeFilter>({ from: null, to: null }),
    policyTypes: new FormControl<PolicyType[]>([]),
    statuses: new FormControl<PolicyStatus[]>([]),
  });

  public skeletonRows = Array(10).fill({});

  constructor() {
    this.filterForm.valueChanges.subscribe(() => {
      this.filterChange.emit({
        number: this.filterForm.controls.number.value,
        holder: this.filterForm.controls.holder.value,
        car: this.filterForm.controls.car.value,
        startDate: this.filterForm.controls.startDate.value ?? { from: null, to: null },
        endDate: this.filterForm.controls.endDate.value ?? { from: null, to: null },
        policyTypes: this.filterForm.controls.policyTypes.value ?? [],
        statuses: this.filterForm.controls.statuses.value ?? [],
      });
    });
  }

  ngOnInit() {
    this.filterForm.controls.number.setValue(this.initialFilter().number);
    this.filterForm.controls.holder.setValue(this.initialFilter().holder);
    this.filterForm.controls.car.setValue(this.initialFilter().car);
    this.filterForm.controls.startDate.setValue(this.initialFilter().startDate);
    this.filterForm.controls.endDate.setValue(this.initialFilter().endDate);
    this.filterForm.controls.policyTypes.setValue(this.initialFilter().policyTypes);
    this.filterForm.controls.statuses.setValue(this.initialFilter().statuses);
  }
}
