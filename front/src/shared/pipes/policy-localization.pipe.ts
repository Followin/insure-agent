import { Pipe, PipeTransform } from '@angular/core';
import { PolicyType, PolicyStatus, CarInsurancePeriodUnit } from '../models/policy.model';

export function getPolicyTypeLocalizedName(type: PolicyType): string {
  switch (type) {
    case 'GreenCard':
      return 'Зеленая карта';
    case 'Medassistance':
      return 'Медассистанс';
    case 'Osago':
      return 'ОСАГО';
  }
}

export function getPolicyStatusLocalizedName(status: PolicyStatus): string {
  switch (status) {
    case 'Active':
      return 'Активный';
    case 'Prolonged':
      return 'Пролонгирован';
    case 'Rejected':
      return 'Отклонён';
    case 'Stopped':
      return 'Остановлен';
    case 'Postponed':
      return 'Отложен';
    case 'Cancelled':
      return 'Расторгнут';
    case 'Project':
      return 'Проект';
    case 'Replaced':
      return 'Заменён';
    case 'Expired':
      return 'Истёк';
  }
}

export function getPolicyStatusSeverity(
  status: PolicyStatus
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  switch (status) {
    case 'Active':
    case 'Prolonged':
      return 'success';
    case 'Project':
      return 'info';
    case 'Expired':
    case 'Postponed':
    case 'Stopped':
      return 'warn';
    case 'Rejected':
    case 'Cancelled':
    case 'Replaced':
      return 'danger';
  }
}

export function getPeriodUnitLocalizedName(unit: CarInsurancePeriodUnit): string {
  switch (unit) {
    case 'Day':
      return 'дней';
    case 'Month':
      return 'месяцев';
    case 'Year':
      return 'лет';
  }
}

@Pipe({ name: 'policyTypeLocal', pure: true, standalone: true })
export class PolicyTypeLocalPipe implements PipeTransform {
  transform(value: PolicyType) {
    return getPolicyTypeLocalizedName(value);
  }
}

@Pipe({ name: 'policyStatusLocal', pure: true, standalone: true })
export class PolicyStatusLocalPipe implements PipeTransform {
  transform(value: PolicyStatus) {
    return getPolicyStatusLocalizedName(value);
  }
}

@Pipe({ name: 'policyStatusSeverity', pure: true, standalone: true })
export class PolicyStatusSeverityPipe implements PipeTransform {
  transform(value: PolicyStatus) {
    return getPolicyStatusSeverity(value);
  }
}

@Pipe({ name: 'periodUnitLocal', pure: true, standalone: true })
export class PeriodUnitLocalPipe implements PipeTransform {
  transform(value: CarInsurancePeriodUnit) {
    return getPeriodUnitLocalizedName(value);
  }
}
