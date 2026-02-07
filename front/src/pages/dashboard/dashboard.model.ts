export interface DashboardStats {
  people_count: number;
  policy_count: number;
  car_count: number;
  upcoming_birthdays: BirthdayPerson[];
  expiring_policies: ExpiringPolicy[];
}

export interface BirthdayPerson {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string;
  age: number;
  days_until: number;
}

export interface ExpiringPolicy {
  id: number;
  series: string;
  number: string;
  policy_type: string;
  end_date: string;
  holder_first_name: string;
  holder_last_name: string;
  days_until: number;
}
