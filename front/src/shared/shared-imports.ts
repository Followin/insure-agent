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
import { MultiSelectModule } from 'primeng/multiselect';
import { PopoverModule } from 'primeng/popover';
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
import { AppTableFilterTextComponent } from './app-table-filters/app-table-filter-text/app-table-filter-text.component';
import { AppTableFilterDateComponent } from './app-table-filters/app-table-filter-date/app-table-filter-date.component';
import { AppTableFilterSelectComponent } from './app-table-filters/app-table-filter-select/app-table-filter-select.component';
import { Type } from '@angular/core';

export const sharedImports: Type<any>[] = [
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
  MultiSelectModule,
  PolicyTypeLocalPipe,
  PolicyStatusLocalPipe,
  PolicyStatusSeverityPipe,
  PeriodUnitLocalPipe,
  SexLocalPipe,
  PersonStatusLocalPipe,
  PersonStatusSeverityPipe,
  OsagoZoneLocalPipe,
  DatepickerComponent,
  PopoverModule,
  AppTableFilterTextComponent,
  AppTableFilterDateComponent,
  AppTableFilterSelectComponent,
];
