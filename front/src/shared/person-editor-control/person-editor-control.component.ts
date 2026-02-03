import { booleanAttribute, Component, computed, forwardRef, input, signal } from '@angular/core';
import { sharedImports } from '../shared-imports';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { PersonSearchService } from './person-search.service';
import { CreatePersonDto, Sex } from './person.model';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export type ExistingPerson = {
  type: 'existing';
  id: number;
};

export type NewPerson = {
  type: 'new';
  person: CreatePersonDto;
};

export type PersonEditorValue = ExistingPerson | NewPerson | null;

@Component({
  selector: 'app-person-editor-control',
  templateUrl: './person-editor-control.component.html',
  imports: [sharedImports],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PersonEditorControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PersonEditorControlComponent),
      multi: true,
    },
  ],
})
export class PersonEditorControlComponent implements ControlValueAccessor, Validator {
  public readonly allowExisting = input(false, { transform: booleanAttribute });
  public readonly header = input<string>();
  public readonly showNameInHeader = input(false, { transform: booleanAttribute });

  public existingPersonIdControl = new FormControl<number | null>(null);

  public sexOptions: { label: string; value: Sex }[] = [
    { label: 'Мужской', value: 'M' },
    { label: 'Женский', value: 'F' },
  ];

  public personGroup = new FormGroup({
    first_name: new FormControl('', [Validators.required]),
    last_name: new FormControl('', [Validators.required]),
    sex: new FormControl<Sex | null>(null, [Validators.required]),
    birth_date: new FormControl<Date | null>(null, [Validators.required]),
    tax_number: new FormControl('', [Validators.required]),
    phone: new FormControl('', [Validators.required]),
    phone2: new FormControl<string | null>(null),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  private personNameSignal = toSignal(
    this.personGroup.valueChanges.pipe(map((v) => `${v.first_name || ''} ${v.last_name || ''}`)),
  );

  public readonly fullHeader = computed(() =>
    this.showNameInHeader()
      ? `${this.header()}${this.personNameSignal() != ' ' ? ': ' + this.personNameSignal() : ''}`
      : this.header(),
  );

  public peopleSearchSuggestions = signal<AutocompleteSugggestion<number>[]>([]);

  private onChange: (value: PersonEditorValue) => void = () => { };
  private onTouched: () => void = () => { };

  constructor(private personSearchService: PersonSearchService) {
    this.personGroup.valueChanges.subscribe(() => this.emitValue());

    this.existingPersonIdControl.valueChanges.subscribe((id) => {
      if (!id || !Number.isInteger(id)) {
        this.personGroup.reset();
        this.personGroup.enable();
        this.emitValue();
        return;
      }

      this.personSearchService.getPerson(id).subscribe((person) => {
        if (!person) {
          throw new Error(`Person with id ${id} not found`);
        }

        this.personGroup.controls.first_name.setValue(person.first_name);
        this.personGroup.controls.last_name.setValue(person.last_name);
        this.personGroup.controls.sex.setValue(person.sex);
        this.personGroup.controls.birth_date.setValue(new Date(person.birth_date));
        this.personGroup.controls.tax_number.setValue(person.tax_number);
        this.personGroup.controls.phone.setValue(person.phone);
        this.personGroup.controls.phone2.setValue(person.phone2);
        this.personGroup.controls.email.setValue(person.email);

        this.personGroup.disable();
        this.emitValue();
      });
    });
  }

  writeValue(value: PersonEditorValue): void {
    if (!value) {
      this.existingPersonIdControl.reset();
      this.personGroup.reset();
      return;
    }

    if (value.type === 'existing') {
      this.existingPersonIdControl.setValue(value.id);
    } else {
      this.personGroup.controls.first_name.setValue(value.person.first_name);
      this.personGroup.controls.last_name.setValue(value.person.last_name);
      this.personGroup.controls.sex.setValue(value.person.sex);
      this.personGroup.controls.birth_date.setValue(new Date(value.person.birth_date));
      this.personGroup.controls.tax_number.setValue(value.person.tax_number);
      this.personGroup.controls.phone.setValue(value.person.phone);
      this.personGroup.controls.phone2.setValue(value.person.phone2);
      this.personGroup.controls.email.setValue(value.person.email);
    }
  }

  registerOnChange(fn: (value: PersonEditorValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    if (this.existingPersonIdControl.value) {
      return null;
    }
    return this.personGroup.valid ? null : { invalid: true };
  }

  public search($event: AutoCompleteCompleteEvent) {
    this.personSearchService.search($event.query).subscribe((people) => {
      this.peopleSearchSuggestions.set(people);
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private emitValue(): void {
    if (this.existingPersonIdControl.value) {
      this.onChange({
        type: 'existing',
        id: this.existingPersonIdControl.value,
      });
      return;
    }

    if (this.personGroup.valid) {
      const v = this.personGroup.value;
      this.onChange({
        type: 'new',
        person: {
          first_name: v.first_name!,
          last_name: v.last_name!,
          sex: v.sex!,
          birth_date: this.formatDate(v.birth_date!),
          tax_number: v.tax_number!,
          phone: v.phone!,
          phone2: v.phone2 || null,
          email: v.email!,
        },
      });
    } else {
      this.onChange(null);
    }

    this.onTouched();
  }
}
