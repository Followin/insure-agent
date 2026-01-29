import { Car, Person, Policy } from './data-model';

export const john: Person = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 555-5555',
  country: 'USA',
  address: '123 Main St, Anytown, USA',
  birthDate: new Date(1990, 0, 1),
};

export const jane: Person = {
  id: 2,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '+1 (555) 555-5555',
  country: 'USA',
  address: '123 Main St, Anytown, USA',
  birthDate: new Date(1990, 0, 1),
};

export const people: Person[] = [john, jane];

export const car1: Car = {
  id: 1,
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1A2B3C4D5E6F7G8H9I0J',
  plate: 'ABC-123',
  chassis: 'Chassis',
  type: 'B1',
  registration: 'Kharkiv',
  mileageKm: 13050,
};

export const cars: Car[] = [car1];

export const policies: Policy[] = [
  {
    id: 1,
    holder: john,
    startDate: new Date(2020, 0, 1),
    endDate: new Date(2021, 0, 1),
    status: 'active',
    type: 'life',
    insured: john,
    period: 'monthly',
    number: '123456789',
    series: 'ABC',
    termYears: 12,
    premium: 1000,
  },
  {
    id: 2,
    holder: jane,
    startDate: new Date(2021, 0, 1),
    endDate: new Date(2022, 0, 1),
    status: 'inactive',
    type: 'life',
    insured: jane,
    period: 'monthly',
    number: '123456789',
    series: 'ABC',
    termYears: 12,
    premium: 1000,
  },
  {
    id: 3,
    holder: john,
    startDate: new Date(2022, 0, 1),
    endDate: new Date(2023, 0, 1),
    status: 'active',
    type: 'green-card',
    number: '123456789',
    series: 'ABC',
    termDays: 12,
    premium: 1000,
    territory: 'USA',
    car: car1,
  },
];
