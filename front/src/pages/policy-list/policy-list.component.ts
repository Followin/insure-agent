import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { sharedImports } from '../../shared/shared-imports';
import { PolicyService } from './policy.service';
import { combineLatest, debounceTime, delay, skip, startWith, switchMap, tap } from 'rxjs';
import { fakeLoadingDelay } from '../../shared/shared-delay';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-list.component.html',
  imports: [sharedImports],
})
export class PolicyListComponent {
  private policyService = inject(PolicyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private initialSearch = this.route.snapshot.queryParams['search'] ?? '';
  private initialActiveOnly = this.route.snapshot.queryParams['activeOnly'] === 'true';

  public filterForm = new FormGroup({
    search: new FormControl(this.initialSearch),
    activeOnly: new FormControl(this.initialActiveOnly),
  });
  public loading = true;

  public policies = toSignal(
    combineLatest([
      this.filterForm.controls.search.valueChanges.pipe(startWith(this.initialSearch), debounceTime(300)),
      this.filterForm.controls.activeOnly.valueChanges.pipe(startWith(this.initialActiveOnly)),
    ]).pipe(
      tap(([search, activeOnly]) => {
        this.router.navigate([], {
          queryParams: { search: search || null, activeOnly: activeOnly || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }),
      switchMap(([search, activeOnly]) => {
        this.loading = true;

        return this.policyService.getAll(search ?? '', activeOnly ?? false).pipe(
          tap(() => (this.loading = false)),
          delay(fakeLoadingDelay),
        );
      }),
    ),
  );
  public skeletonRows = Array(13).fill({});
}
