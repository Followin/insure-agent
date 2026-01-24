import { booleanAttribute, Component, input } from '@angular/core';
import { sharedImports } from '../shared-imports';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { PersonSearchService } from './person-search.service';
import { Person } from '../../data/data-model';

export type ExistingPerson = {
  type: 'existing';
  id: number;
};

export type NewPerson = {
  type: 'new';
  person: Omit<Person, 'id'>;
};

@Component({
  selector: 'app-person-editor',
  templateUrl: './person-editor-control.component.html',
  imports: [sharedImports],
})
export class PersonEditorControlComponent {
  public readonly allowExisting = input(false, { transform: booleanAttribute });
  public readonly header = input('Человек');

  public existingPersonIdControl = new FormControl<number | null>(null);

  public personGroup = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.required]),
    country: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    birthDate: new FormControl<Date | null>(null, [Validators.required]),
  });

  public peopleSearchSuggestions: AutocompleteSugggestion<number>[] = [];

  constructor(private personSearchService: PersonSearchService) {
    this.existingPersonIdControl.valueChanges.subscribe((id) => {
      if (!id || !Number.isInteger(id)) {
        this.personGroup.reset();
        this.personGroup.enable();
        return;
      }

      this.personSearchService.getPerson(id).subscribe((person) => {
        if (!person) {
          throw new Error(`Person with id ${id} not found`);
        }

        this.personGroup.controls.firstName.setValue(person.firstName);
        this.personGroup.controls.lastName.setValue(person.lastName);
        this.personGroup.controls.email.setValue(person.email);
        this.personGroup.controls.phone.setValue(person.phone);
        this.personGroup.controls.country.setValue(person.country);
        this.personGroup.controls.address.setValue(person.address);
        this.personGroup.controls.birthDate.setValue(person.birthDate);

        this.personGroup.disable();
      });
    });
  }

  public search($event: AutoCompleteCompleteEvent) {
    this.personSearchService.search($event.query).subscribe((people) => {
      this.peopleSearchSuggestions = people;
    });
  }

  public getSelectedPerson(): ExistingPerson | NewPerson | null {
    if (this.existingPersonIdControl.value) {
      return {
        type: 'existing',
        id: this.existingPersonIdControl.value,
      };
    }

    if (this.personGroup.valid) {
      return {
        type: 'new',
        person: {
          firstName: this.personGroup.controls.firstName.value!,
          lastName: this.personGroup.controls.lastName.value!,
          email: this.personGroup.controls.email.value!,
          phone: this.personGroup.controls.phone.value!,
          country: this.personGroup.controls.country.value!,
          address: this.personGroup.controls.address.value!,
          birthDate: this.personGroup.controls.birthDate.value!,
        },
      };
    }

    return null;
  }
}
