import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { sharedImports } from '../../shared/shared-imports';
import { PersonService } from './person.service';
import { combineLatest, debounceTime, delay, startWith, switchMap, tap } from 'rxjs';
import { fakeLoadingDelay } from '../../shared/shared-delay';
import { PersonStatus, personStatusValues } from '../../shared/models/person.model';
import { getPersonStatusLocalizedName } from '../../shared/pipes/person-localization.pipe';

@Component({
  selector: 'app-person-list',
  templateUrl: './person-list.component.html',
  imports: [sharedImports],
})
export class PersonListComponent {
  private personService = inject(PersonService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private initialSearch = this.route.snapshot.queryParams['search'] ?? '';
  private initialStatuses: PersonStatus[] = this.route.snapshot.queryParams['statuses']
    ? this.route.snapshot.queryParams['statuses'].split(',').map((x: string) => x as PersonStatus)
    : ['Active'];

  public searchControl = new FormControl(this.initialSearch);
  public statusControl = new FormControl<PersonStatus[]>(this.initialStatuses);
  public statusOptions = personStatusValues.map((x) => ({
    label: getPersonStatusLocalizedName(x),
    value: x,
  }));
  public loading = true;

  public people = toSignal(
    combineLatest([
      this.searchControl.valueChanges.pipe(startWith(this.initialSearch)),
      this.statusControl.valueChanges.pipe(startWith(this.initialStatuses)),
    ]).pipe(
      debounceTime(300),
      tap(([search, statuses]) => {
        this.router.navigate([], {
          queryParams: {
            search: search || null,
            statuses: statuses?.length ? statuses.join(',') : null,
          },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }),
      switchMap(([search, statuses]) => {
        this.loading = true;
        return this.personService.getAll(search ?? '', statuses ?? []).pipe(
          tap(() => (this.loading = false)),
          delay(fakeLoadingDelay),
        );
      }),
    ),
  );
  public skeletonRows = Array(13).fill({});
}
