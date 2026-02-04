import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
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

  public personControl = new FormControl<PersonEditorValue>(null);

  public submit() {
    const value = this.personControl.value;
    if (!value || value.kind !== 'New') return;

    this.personService.create(value).subscribe(() => {
      this.router.navigate(['/people']);
    });
  }
}
