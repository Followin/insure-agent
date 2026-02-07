import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { sharedImports } from '../../shared/shared-imports';
import { PersonService } from './person.service';
import { debounceTime, delay, startWith, switchMap, tap } from 'rxjs';
import { fakeLoadingDelay } from '../../shared/shared-delay';

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

  public searchControl = new FormControl(this.initialSearch);
  public loading = true;

  public people = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(this.initialSearch),
      debounceTime(300),
      tap((search) => {
        this.router.navigate([], {
          queryParams: { search: search || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }),
      switchMap((search) => {
        this.loading = true;
        return this.personService.getAll(search ?? '').pipe(
          tap(() => (this.loading = false)),
          delay(fakeLoadingDelay),
        );
      }),
    ),
  );
  public skeletonRows = Array(13).fill({});
}
