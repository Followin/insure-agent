export const policyTypeValues = ['GreenCard', 'Medassistance', 'Osago'] as const;
export type PolicyType = (typeof policyTypeValues)[number];

export const policyStatusValues = [
  'Active',
  'Project',
  'Prolonged',
  'Rejected',
  'Stopped',
  'Postponed',
  'Cancelled',
  'Replaced',
  'Expired',
] as const;
export type PolicyStatus = (typeof policyStatusValues)[number];

export const carInsurancePeriodUnitValues = ['Day', 'Month', 'Year'] as const;
export type CarInsurancePeriodUnit = (typeof carInsurancePeriodUnitValues)[number];

export const osagoZoneValues = ['Zone1', 'Zone2', 'Zone3', 'Zone4', 'Zone5', 'Outside'] as const;
export type OsagoZone = (typeof osagoZoneValues)[number];

export interface PolicyShort {
  id: number;
  policy_type: PolicyType;
  holder_name: string;
  series: string;
  number: string;
  start_date: string;
  end_date: string | null;
  status: PolicyStatus;
  car_model: string | null;
  car_plate: string | null;
  agent_names: string | null;
}
