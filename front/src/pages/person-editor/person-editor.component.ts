import { Component } from '@angular/core';
import { sharedImports } from '../../shared/shared-imports';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-person-editor',
  templateUrl: './person-editor.component.html',
  imports: [sharedImports],
})
export class PersonEditorComponent {
  public personGroup = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.required]),
    country: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    birthDate: new FormControl<Date | null>(null, [Validators.required]),
  });
}
