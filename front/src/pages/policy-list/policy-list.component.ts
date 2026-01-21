import { Component } from '@angular/core';
import { Policy } from '../../data/data-model';
import { policies } from '../../data/data';
import { sharedImports } from '../../shared/shared-imports';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-list.component.html',
  imports: [sharedImports],
})
export class PolicyListComponent {
  public policies: Policy[] = policies;
}
