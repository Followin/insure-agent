import { PolicyShort } from '../models/policy.model';

export type Sex = 'M' | 'F' | 'Unknown';

export interface PersonDto {
  id: number;
  first_name: string;
  last_name: string;
  sex: Sex;
  birth_date: string;
  tax_number: string;
  phone: string;
  phone2: string | null;
  email: string;
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

export type PersonRef = PersonRefExisting | PersonRefNew;
