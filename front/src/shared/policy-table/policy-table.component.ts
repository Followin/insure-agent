import { Component, booleanAttribute, input, output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { sharedImports } from '../shared-imports';
import { PolicyShort } from '../models/policy.model';

export interface PolicyTableFilter {
  search: string;
  activeOnly: boolean;
}

@Component({
  selector: 'app-policy-table',
  templateUrl: './policy-table.component.html',
  imports: [sharedImports],
})
export class PolicyTableComponent {
  public policies = input.required<PolicyShort[]>();
  public loading = input(false, { transform: booleanAttribute });
  public showSearch = input(false, { transform: booleanAttribute });
  public showHolderColumn = input(true, { transform: booleanAttribute });

  public initialSearch = input('');
  public initialActiveOnly = input(false, { transform: booleanAttribute });

  public filterChange = output<PolicyTableFilter>();

  public filterForm = new FormGroup({
    search: new FormControl(''),
    activeOnly: new FormControl(false),
  });

  public skeletonRows = Array(10).fill({});

  constructor() {
    this.filterForm.valueChanges.subscribe(() => {
      this.filterChange.emit({
        search: this.filterForm.controls.search.value ?? '',
        activeOnly: this.filterForm.controls.activeOnly.value ?? false,
      });
    });
  }

  ngOnInit() {
    this.filterForm.controls.search.setValue(this.initialSearch());
    this.filterForm.controls.activeOnly.setValue(this.initialActiveOnly());
  }
}
