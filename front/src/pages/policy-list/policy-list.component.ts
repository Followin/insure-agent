import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { sharedImports } from '../../shared/shared-imports';
import { PolicyService } from './policy.service';
import { debounceTime, delay, Subject, switchMap, tap } from 'rxjs';
import { fakeLoadingDelay } from '../../shared/shared-delay';
import { PolicyTableComponent, PolicyTableFilter } from '../../shared/policy-table/policy-table.component';
import { PolicyShort } from '../../shared/models/policy.model';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-list.component.html',
  imports: [sharedImports, PolicyTableComponent],
})
export class PolicyListComponent {
  private policyService = inject(PolicyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public initialSearch = this.route.snapshot.queryParams['search'] ?? '';
  public initialActiveOnly = this.route.snapshot.queryParams['activeOnly'] === 'true';

  public loading = true;
  public policies = signal<PolicyShort[] | null>(null);

  private filterSubject = new Subject<PolicyTableFilter>();

  constructor() {
    this.filterSubject
      .pipe(
        debounceTime(300),
        tap((filter) => {
          this.router.navigate([], {
            queryParams: { search: filter.search || null, activeOnly: filter.activeOnly || null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }),
        switchMap((filter) => {
          this.loading = true;
          return this.policyService.getAll(filter.search, filter.activeOnly).pipe(
            tap(() => (this.loading = false)),
            delay(fakeLoadingDelay),
          );
        }),
      )
      .subscribe((policies) => {
        this.policies.set(policies);
      });

    // Initial load
    this.filterSubject.next({ search: this.initialSearch, activeOnly: this.initialActiveOnly });
  }

  public onFilterChange(filter: PolicyTableFilter) {
    this.filterSubject.next(filter);
  }
}
