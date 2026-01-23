import { Component } from '@angular/core';
import { Person } from '../../data/data-model';
import { people } from '../../data/data';
import { sharedImports } from '../../shared/shared-imports';

@Component({
  selector: 'app-person-list',
  templateUrl: './person-list.component.html',
  imports: [sharedImports],
})
export class PersonListComponent {
  public people: Person[] = people;
}
