import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { sharedImports } from '../../shared/shared-imports';
import { PolicyService } from './policy.service';
import { finalize, map, switchMap, tap } from 'rxjs';
import {
  PolicyTableComponent,
  PolicyTableFilter,
} from '../../shared/policy-table/policy-table.component';
import { PolicyShort, PolicyStatus, PolicyType } from '../../shared/models/policy.model';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-list.component.html',
  imports: [sharedImports, PolicyTableComponent],
})
export class PolicyListComponent {
  private policyService = inject(PolicyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public loading = true;
  public filter: PolicyTableFilter = null!;
  public policies = signal<PolicyShort[] | null>(null);

  constructor() {
    this.route.queryParams
      .pipe(
        map(deserializeFilter),
        tap((newFilter) => {
          this.filter = newFilter;
          this.loading = true;
        }),
        switchMap((filter) =>
          this.policyService.getAll(filter).pipe(finalize(() => (this.loading = false))),
        ),
      )
      .subscribe((policies) => this.policies.set(policies));
  }

  public onFilterChange(filter: PolicyTableFilter) {
    const newQueryParams = serializeFilter(filter);
    this.router.navigate(['policies'], { queryParams: newQueryParams });
  }
}

function deserializeFilter(queryParams: Params): PolicyTableFilter {
  return {
    number: queryParams['number'] || null,
    holder: queryParams['holder'] || null,
    car: queryParams['car'] || null,
    startDate: {
      from: queryParams['startDateFrom'] || null,
      to: queryParams['startDateTo'] || null,
    },
    endDate: {
      from: queryParams['endDateFrom'] || null,
      to: queryParams['endDateTo'] || null,
    },
    policyTypes: queryParams['policyTypes']
      ? queryParams['policyTypes'].split(',').map((x: string) => x as PolicyType)
      : [],
    statuses: queryParams['statuses']
      ? queryParams['statuses'].split(',').map((x: string) => x as PolicyStatus)
      : [],
  };
}

function serializeFilter(filter: PolicyTableFilter): Params {
  return {
    number: filter.number || null,
    holder: filter.holder || null,
    car: filter.car || null,
    startDateFrom: filter.startDate.from || null,
    startDateTo: filter.startDate.to || null,
    endDateFrom: filter.endDate.from || null,
    endDateTo: filter.endDate.to || null,
    policyTypes: filter.policyTypes.join(',') || null,
    statuses: filter.statuses.join(',') || null,
  };
}
