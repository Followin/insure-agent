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
import {
  OldPolicyTypeLocalPipe,
  OldPolicyStatusLocalPipe,
  PolicyPeriodLocalPipe,
} from '../data/localization-pipes';
import {
  PolicyTypeLocalPipe,
  PolicyStatusLocalPipe,
} from './pipes/policy-localization.pipe';

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
  OldPolicyTypeLocalPipe,
  OldPolicyStatusLocalPipe,
  PolicyPeriodLocalPipe,
  PolicyTypeLocalPipe,
  PolicyStatusLocalPipe,
];
