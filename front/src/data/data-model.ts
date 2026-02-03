export type Sex = 'M' | 'F';

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  sex: Sex;
  birthDate: Date;
  taxNumber: string;
  phone: string;
  phone2: string | null;
  email: string;
}

export interface PolicyBase {
  id: number;
  series: string;
  number: string;
  holder: Person;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive';
}

export const lifePolicyPeriodValues = [
  'annual',
  'semi-annual',
  'quarterly',
  'monthly',
  'one-time',
] as const;
export type LifePolicyPeriods = (typeof lifePolicyPeriodValues)[number];

export const policyTypes = ['green-card', 'life'] as const;

export interface LifePolicy {
  type: 'life';
  insured: Person;
  termYears: number;
  premium: number;
  period: LifePolicyPeriods;
}

export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  plate: string;
  chassis: string;
  type: string;
  registration: string;
  mileageKm: number;
}

export interface GreenCardPolicy {
  type: 'green-card';
  car: Car;
  territory: string;
  termDays: number;
  premium: number;
}

export type Policy = PolicyBase & (LifePolicy | GreenCardPolicy);
