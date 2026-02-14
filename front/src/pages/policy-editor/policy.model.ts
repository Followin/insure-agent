import { PersonDto, PersonRef } from '../../shared/person-editor-control/person.model';
import { CarDto, CarRef } from '../../shared/models/car.model';
import {
  PolicyStatus,
  PolicyType,
  CarInsurancePeriodUnit,
  OsagoZone,
} from '../../shared/models/policy.model';

// === Policy Type Specific Data (for requests) ===

export interface GreenCardData {
  policy_type: 'GreenCard';
  territory: string;
  period_in_units: number;
  period_unit: CarInsurancePeriodUnit;
  premium: number;
  car: CarRef;
}

export interface MedassistanceData {
  policy_type: 'Medassistance';
  territory: string;
  period_days: number;
  premium: number;
  payout: number;
  program: string;
  members: PersonRef[];
}

export interface OsagoData {
  policy_type: 'Osago';
  period_in_units: number;
  period_unit: CarInsurancePeriodUnit;
  zone: OsagoZone;
  exempt: string;
  premium: number;
  car: CarRef;
}

export type PolicyData = GreenCardData | MedassistanceData | OsagoData;

// === Create Policy Request ===

export type CreatePolicyRequest = {
  holder: PersonRef;
  series: string;
  number: string;
  start_date: string;
  end_date: string | null;
} & PolicyData;

// === Update Policy Request ===

export type UpdatePolicyRequest = CreatePolicyRequest & {
  status: PolicyStatus;
};

// === Create Policy Response ===

export interface CreatePolicyResponse {
  id: number;
  policy_type: PolicyType;
  holder_id: number;
  series: string;
  number: string;
  start_date: string;
  end_date: string | null;
  status: PolicyStatus;
}

// === Policy Full Response (for GET by id) ===

export interface GreenCardDetails {
  policy_type: 'GreenCard';
  territory: string;
  period_in_units: number;
  period_unit: CarInsurancePeriodUnit;
  premium: number;
  car: CarDto;
}

export interface MedassistanceDetails {
  policy_type: 'Medassistance';
  territory: string;
  period_days: number;
  premium: number;
  payout: number;
  program: string;
  members: PersonDto[];
}

export interface OsagoDetails {
  policy_type: 'Osago';
  period_in_units: number;
  period_unit: CarInsurancePeriodUnit;
  zone: OsagoZone;
  exempt: string;
  premium: number;
  car: CarDto;
}

export type PolicyDetails = GreenCardDetails | MedassistanceDetails | OsagoDetails;

export type PolicyFull = {
  id: number;
  holder: PersonDto;
  series: string;
  number: string;
  start_date: string;
  end_date: string | null;
  status: PolicyStatus;
} & PolicyDetails;
