import { Component } from '@angular/core';
import { Person, Policy } from '../../data/data-model';
import { people, policies } from '../../data/data';
import { sharedImports } from '../../shared/shared-imports';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [sharedImports],
})
export class DashboardComponent {
  public people: Person[] = people;
  public policies: Policy[] = policies;
}
