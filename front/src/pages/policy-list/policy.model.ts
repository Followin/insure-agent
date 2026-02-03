export type PolicyType = 'GreenCard' | 'Medassistance' | 'Osago';
export type PolicyStatus = 'Expired' | 'Active' | 'Terminated';

export interface PolicyShort {
  id: number;
  policy_type: PolicyType;
  holder_name: string;
  series: string;
  number: string;
  start_date: string;
  end_date: string | null;
  status: PolicyStatus;
}
