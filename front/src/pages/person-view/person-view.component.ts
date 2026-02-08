import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { sharedImports } from '../../shared/shared-imports';
import { PersonService } from '../person-list/person.service';
import { PersonWithPolicies } from '../../shared/person-editor-control/person.model';
import { fakeLoadingDelay } from '../../shared/shared-delay';
import { delay } from 'rxjs';
import { PolicyTableComponent } from '../../shared/policy-table/policy-table.component';

@Component({
  selector: 'app-person-view',
  templateUrl: './person-view.component.html',
  imports: [sharedImports, PolicyTableComponent],
})
export class PersonViewComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private personService = inject(PersonService);

  public person = signal<PersonWithPolicies | null>(null);
  public loading = signal(true);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.personService
      .getById(id)
      .pipe(delay(fakeLoadingDelay))
      .subscribe({
        next: (person) => {
          this.person.set(person);
          this.loading.set(false);
        },
        error: () => {
          this.router.navigate(['/people']);
        },
      });
  }
}
