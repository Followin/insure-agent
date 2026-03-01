import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { sharedImports } from '../../shared/shared-imports';
import { PolicyService } from './policy.service';
import { debounceTime, delay, Subject, switchMap, tap } from 'rxjs';
import { fakeLoadingDelay } from '../../shared/shared-delay';
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

  public initialFilter: PolicyTableFilter;

  public loading = true;
  public policies = signal<PolicyShort[] | null>(null);

  private filterSubject = new Subject<PolicyTableFilter>();

  constructor() {
    this.initialFilter = {
      number: this.route.snapshot.queryParamMap.get('number'),
      holder: this.route.snapshot.queryParamMap.get('holder'),
      car: this.route.snapshot.queryParamMap.get('car'),
      startDate: {
        from: this.route.snapshot.queryParamMap.get('startDateFrom'),
        to: this.route.snapshot.queryParamMap.get('startDateTo'),
      },
      endDate: {
        from: this.route.snapshot.queryParamMap.get('endDateFrom'),
        to: this.route.snapshot.queryParamMap.get('endDateTo'),
      },
      policyTypes: this.route.snapshot.queryParamMap
        .getAll('policyTypes')
        .map((x) => x as PolicyType),
      statuses: this.route.snapshot.queryParamMap.getAll('statuses').map((x) => x as PolicyStatus),
    };

    this.filterSubject
      .pipe(
        debounceTime(300),
        tap((filter) => {
          this.router.navigate([], {
            queryParams: {
              number: filter.number,
              holder: filter.holder,
              car: filter.car,
              startDateFrom: filter.startDate.from,
              startDateTo: filter.startDate.to,
              endDateFrom: filter.endDate.from,
              endDateTo: filter.endDate.to,
              policyTypes: filter.policyTypes.length ? filter.policyTypes : null,
              statuses: filter.statuses.length ? filter.statuses : null,
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }),
        switchMap((filter) => {
          this.loading = true;
          return this.policyService.getAll(filter).pipe(
            tap(() => (this.loading = false)),
            delay(fakeLoadingDelay),
          );
        }),
      )
      .subscribe((policies) => {
        this.policies.set(policies);
      });

    // Initial load
    this.filterSubject.next(this.initialFilter);
  }

  public onFilterChange(filter: PolicyTableFilter) {
    this.filterSubject.next(filter);
  }
}
