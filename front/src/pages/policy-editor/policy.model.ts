import { PersonRef } from '../../shared/person-editor-control/person.model';
import { CarRef } from '../../shared/models/car.model';
import { PolicyStatus, PolicyType } from '../../shared/models/policy.model';

// === Policy Type Specific Data ===

export interface GreenCardData {
  policy_type: 'GreenCard';
  territory: string;
  period_months: number;
  premium: number;
  car: CarRef;
}

export interface MedassistanceData {
  policy_type: 'Medassistance';
  territory: string;
  period_months: number;
  premium: number;
  payout: number;
  program: string;
  members: PersonRef[];
}

export interface OsagoData {
  policy_type: 'Osago';
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
