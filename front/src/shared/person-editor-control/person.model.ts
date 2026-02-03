export type Sex = 'M' | 'F';

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

export type CreatePersonDto = Omit<PersonDto, 'id'>;
