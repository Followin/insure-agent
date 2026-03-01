import {
  booleanAttribute,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AutoComplete } from 'primeng/autocomplete';
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
import { CreatePersonDto, PersonRef, PersonStatus, Sex } from './person.model';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export type PersonEditorValue = PersonRef | null;

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
  public readonly showRemoveButton = input(false, { transform: booleanAttribute });
  public readonly onRemove = output<void>();

  private autocomplete = viewChild<AutoComplete>('existingPersonAutocomplete');

  public existingPersonIdControl = new FormControl<number | null>(null);

  private originalPersonData: CreatePersonDto | null = null;

  public sexOptions: { label: string; value: Sex }[] = [
    { label: 'Чоловіча', value: 'M' },
    { label: 'Жіноча', value: 'F' },
    { label: 'Невідомо', value: 'Unknown' },
  ];

  public statusOptions: { label: string; value: PersonStatus }[] = [
    { label: 'Активний', value: 'Active' },
    { label: 'Неактивний', value: 'Inactive' },
    { label: 'Архівований', value: 'Archived' },
  ];

  public personGroup = new FormGroup({
    first_name: new FormControl('', [Validators.required]),
    first_name_lat: new FormControl<string | null>(null),
    last_name: new FormControl('', [Validators.required]),
    last_name_lat: new FormControl<string | null>(null),
    patronymic_name: new FormControl<string | null>(null),
    patronymic_name_lat: new FormControl<string | null>(null),
    sex: new FormControl<Sex | null>(null, [Validators.required]),
    birth_date: new FormControl<string | null>(null, [Validators.required]),
    tax_number: new FormControl('', [Validators.required]),
    phone: new FormControl('', [Validators.required]),
    phone2: new FormControl<string | null>(null),
    email: new FormControl('', [Validators.required]),
    status: new FormControl<PersonStatus>('Active', [Validators.required]),
  });

  private personNameSignal = toSignal(
    this.personGroup.valueChanges.pipe(map((v) => `${v.first_name || ''} ${v.last_name || ''}`)),
  );

  public readonly fullHeader = computed(() =>
    this.showNameInHeader()
      ? `${this.header()}${this.personNameSignal() != ' ' ? ': ' + this.personNameSignal() : ''}`
      : this.header(),
  );

  public peopleSearchSuggestions = signal<SelectOption<number>[]>([]);

  private onChange: (value: PersonEditorValue) => void = () => { };
  private onTouched: () => void = () => { };

  constructor(private personSearchService: PersonSearchService) {
    this.personGroup.valueChanges.subscribe(() => this.emitValue());

    this.existingPersonIdControl.valueChanges.subscribe((id) => {
      if (!id || !Number.isInteger(id)) {
        this.personGroup.reset();
        this.personGroup.enable();
        this.originalPersonData = null;
        this.emitValue();
        return;
      }

      this.personSearchService.getPerson(id).subscribe((person) => {
        if (!person) {
          throw new Error(`Person with id ${id} not found`);
        }

        const autocomplete = this.autocomplete();
        if (this.peopleSearchSuggestions.length == 0 && autocomplete?.inputEL) {
          // initial load
          autocomplete.inputEL.nativeElement.value = `${person.first_name} ${person.last_name}`;
        }

        this.personGroup.controls.first_name.setValue(person.first_name);
        this.personGroup.controls.first_name_lat.setValue(person.first_name_lat);
        this.personGroup.controls.last_name.setValue(person.last_name);
        this.personGroup.controls.last_name_lat.setValue(person.last_name_lat);
        this.personGroup.controls.patronymic_name.setValue(person.patronymic_name);
        this.personGroup.controls.patronymic_name_lat.setValue(person.patronymic_name_lat);
        this.personGroup.controls.sex.setValue(person.sex);
        this.personGroup.controls.birth_date.setValue(person.birth_date);
        this.personGroup.controls.tax_number.setValue(person.tax_number);
        this.personGroup.controls.phone.setValue(person.phone);
        this.personGroup.controls.phone2.setValue(person.phone2);
        this.personGroup.controls.email.setValue(person.email);
        this.personGroup.controls.status.setValue(person.status);

        this.originalPersonData = {
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
        };

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

    if (value.kind === 'Existing') {
      this.existingPersonIdControl.setValue(value.id);
    } else {
      this.personGroup.controls.first_name.setValue(value.first_name);
      this.personGroup.controls.first_name_lat.setValue(value.first_name_lat);
      this.personGroup.controls.last_name.setValue(value.last_name);
      this.personGroup.controls.last_name_lat.setValue(value.last_name_lat);
      this.personGroup.controls.patronymic_name.setValue(value.patronymic_name);
      this.personGroup.controls.patronymic_name_lat.setValue(value.patronymic_name_lat);
      this.personGroup.controls.sex.setValue(value.sex);
      this.personGroup.controls.birth_date.setValue(value.birth_date);
      this.personGroup.controls.tax_number.setValue(value.tax_number);
      this.personGroup.controls.phone.setValue(value.phone);
      this.personGroup.controls.phone2.setValue(value.phone2);
      this.personGroup.controls.email.setValue(value.email);
      this.personGroup.controls.status.setValue(value.status);
    }
  }

  registerOnChange(fn: (value: PersonEditorValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    if (this.existingPersonIdControl.value && !this.hasChanges()) {
      return null;
    }
    return this.personGroup.valid ? null : { invalid: true };
  }

  public search($event: AutoCompleteCompleteEvent) {
    this.personSearchService.search($event.query).subscribe((people) => {
      this.peopleSearchSuggestions.set(people);
    });
  }

  private hasChanges(): boolean {
    if (!this.originalPersonData) return false;

    const v = this.personGroup.value;
    const o = this.originalPersonData;

    return (
      v.first_name !== o.first_name ||
      (v.first_name_lat || null) !== o.first_name_lat ||
      v.last_name !== o.last_name ||
      (v.last_name_lat || null) !== o.last_name_lat ||
      (v.patronymic_name || null) !== o.patronymic_name ||
      (v.patronymic_name_lat || null) !== o.patronymic_name_lat ||
      v.sex !== o.sex ||
      v.birth_date !== o.birth_date ||
      v.tax_number !== o.tax_number ||
      v.phone !== o.phone ||
      (v.phone2 || null) !== o.phone2 ||
      v.email !== o.email ||
      v.status !== o.status
    );
  }

  private emitValue(): void {
    const existingId = this.existingPersonIdControl.value;

    if (existingId && this.originalPersonData) {
      if (this.personGroup.valid && this.hasChanges()) {
        const v = this.personGroup.value;
        this.onChange({
          kind: 'ExistingWithUpdates',
          id: existingId,
          first_name: v.first_name!,
          first_name_lat: v.first_name_lat || null,
          last_name: v.last_name!,
          last_name_lat: v.last_name_lat || null,
          patronymic_name: v.patronymic_name || null,
          patronymic_name_lat: v.patronymic_name_lat || null,
          sex: v.sex!,
          birth_date: v.birth_date!,
          tax_number: v.tax_number!,
          phone: v.phone!,
          phone2: v.phone2 || null,
          email: v.email!,
          status: v.status!,
        });
      } else {
        this.onChange({
          kind: 'Existing',
          id: existingId,
        });
      }
      this.onTouched();
      return;
    }

    if (this.personGroup.valid) {
      const v = this.personGroup.value;
      this.onChange({
        kind: 'New',
        first_name: v.first_name!,
        first_name_lat: v.first_name_lat || null,
        last_name: v.last_name!,
        last_name_lat: v.last_name_lat || null,
        patronymic_name: v.patronymic_name || null,
        patronymic_name_lat: v.patronymic_name_lat || null,
        sex: v.sex!,
        birth_date: v.birth_date!,
        tax_number: v.tax_number!,
        phone: v.phone!,
        phone2: v.phone2 || null,
        email: v.email!,
        status: v.status!,
      });
    } else {
      this.onChange(null);
    }

    this.onTouched();
  }
}
