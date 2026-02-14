import { Component, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { sharedImports } from '../../shared/shared-imports';
import { PersonService } from '../person-list/person.service';
import {
  PersonEditorControlComponent,
  PersonEditorValue,
} from '../../shared/person-editor-control/person-editor-control.component';

@Component({
  selector: 'app-person-editor',
  templateUrl: './person-editor.component.html',
  imports: [sharedImports, PersonEditorControlComponent],
})
export class PersonEditorComponent {
  private personService = inject(PersonService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public editMode = signal(false);
  public personId = signal<number | null>(null);
  public loading = signal(false);

  public personControl = new FormControl<PersonEditorValue>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode.set(true);
      this.personId.set(Number(id));
      this.loading.set(true);
      this.loadPerson(Number(id));
    }
  }

  private loadPerson(id: number) {
    this.personService.getById(id).subscribe({
      next: (person) => {
        this.personControl.setValue({
          kind: 'New',
          first_name: person.first_name,
          first_name_lat: person.first_name_lat,
          last_name: person.last_name,
          last_name_lat: person.last_name_lat,
          patronymic_name: person.patronymic_name,
          patronymic_name_lat: person.patronymic_name_lat,
          sex: person.sex,
          birth_date: person.birth_date,
          tax_number: person.tax_number,
          phone: person.phone,
          phone2: person.phone2,
          email: person.email,
          status: person.status,
        });
        this.loading.set(false);
      },
      error: () => {
        this.router.navigate(['/people']);
      },
    });
  }

  public submit() {
    const value = this.personControl.value;
    if (!value || value.kind !== 'New') return;

    const personData = {
      first_name: value.first_name,
      first_name_lat: value.first_name_lat,
      last_name: value.last_name,
      last_name_lat: value.last_name_lat,
      patronymic_name: value.patronymic_name,
      patronymic_name_lat: value.patronymic_name_lat,
      sex: value.sex,
      birth_date: value.birth_date,
      tax_number: value.tax_number,
      phone: value.phone,
      phone2: value.phone2,
      email: value.email,
      status: value.status,
    };

    if (this.editMode() && this.personId()) {
      this.personService.update(this.personId()!, personData).subscribe(() => {
        this.router.navigate(['/people', this.personId()]);
      });
    } else {
      this.personService.create(personData).subscribe(() => {
        this.router.navigate(['/people']);
      });
    }
  }
}
