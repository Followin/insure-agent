import { PolicyShort } from '../models/policy.model';

export type Sex = 'M' | 'F' | 'Unknown';
export type PersonStatus = 'Active' | 'Inactive' | 'Archived';

export interface PersonDto {
  id: number;
  first_name: string;
  first_name_lat: string | null;
  last_name: string;
  last_name_lat: string | null;
  patronymic_name: string | null;
  patronymic_name_lat: string | null;
  sex: Sex;
  birth_date: string;
  tax_number: string;
  phone: string;
  phone2: string | null;
  email: string;
  status: PersonStatus;
}

export interface PersonWithPolicies extends PersonDto {
  policies: PolicyShort[];
}

export type CreatePersonDto = Omit<PersonDto, 'id'>;

// === Person Reference (matches backend PersonRef) ===

export type PersonRefExisting = {
  kind: 'Existing';
  id: number;
};

export type PersonRefNew = {
  kind: 'New';
} & CreatePersonDto;

export type PersonRefExistingWithUpdates = {
  kind: 'ExistingWithUpdates';
  id: number;
} & CreatePersonDto;

export type PersonRef = PersonRefExisting | PersonRefNew | PersonRefExistingWithUpdates;
