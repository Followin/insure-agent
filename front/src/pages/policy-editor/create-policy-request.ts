import { LifePolicyPeriods } from '../../data/data-model';
import { ExistingCar, NewCar } from '../../shared/car-editor-control/car-editor-control.component';
import { PersonEditorValue } from '../../shared/person-editor-control/person-editor-control.component';

type CreatePolicyRequestBase = {
  series: string;
  number: string;
  holder: PersonEditorValue;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive';
};

type CreatePolicyRequestLife = {
  type: 'life';
  insured: PersonEditorValue;
  termYears: number;
  premium: number;
  period: LifePolicyPeriods;
};

type CreatePolicyRequestGreenCard = {
  type: 'green-card';
  car: ExistingCar | NewCar;
  territory: string;
  termDays: number;
  premium: number;
};

export type CreatePolicyRequest = CreatePolicyRequestBase &
  (CreatePolicyRequestLife | CreatePolicyRequestGreenCard);
