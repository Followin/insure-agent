import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import {
  PolicyTypeLocalPipe,
  PolicyStatusLocalPipe,
  PolicyStatusSeverityPipe,
  PeriodUnitLocalPipe,
  OsagoZoneLocalPipe,
} from './pipes/policy-localization.pipe';
import {
  SexLocalPipe,
  PersonStatusLocalPipe,
  PersonStatusSeverityPipe,
} from './pipes/person-localization.pipe';
import { DatepickerComponent } from './datepicker/datepicker.component';

export const sharedImports = [
  CardModule,
  TableModule,
  PanelModule,
  CommonModule,
  TagModule,
  InputTextModule,
  ReactiveFormsModule,
  ButtonModule,
  RouterModule,
  FloatLabelModule,
  DatePickerModule,
  AutoCompleteModule,
  SelectModule,
  InputNumberModule,
  SkeletonModule,
  CheckboxModule,
  IconFieldModule,
  InputIconModule,
  PolicyTypeLocalPipe,
  PolicyStatusLocalPipe,
  PolicyStatusSeverityPipe,
  PeriodUnitLocalPipe,
  SexLocalPipe,
  PersonStatusLocalPipe,
  PersonStatusSeverityPipe,
  OsagoZoneLocalPipe,
  DatepickerComponent,
];
