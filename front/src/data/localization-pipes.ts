import { Pipe, PipeTransform } from '@angular/core';
import { LifePolicy, Policy } from './data-model';
import { PolicyType as BackendPolicyType, PolicyStatus as BackendPolicyStatus } from '../pages/policy-list/policy.model';

export function getTypeLocalizedName(type: Policy['type']): string {
  switch (type) {
    case 'life':
      return 'Лайф';
    case 'green-card':
      return 'Зеленая карта';
  }
}

export function getStatusLocalizedName(status: Policy['status']): string {
  switch (status) {
    case 'active':
      return 'Активный';
    case 'inactive':
      return 'Неактивный';
  }
}

export function getBackendTypeLocalizedName(type: BackendPolicyType): string {
  switch (type) {
    case 'GreenCard':
      return 'Зеленая карта';
    case 'Medassistance':
      return 'Медассистанс';
    case 'Osago':
      return 'ОСАГО';
  }
}

export function getBackendStatusLocalizedName(status: BackendPolicyStatus): string {
  switch (status) {
    case 'Active':
      return 'Активный';
    case 'Expired':
      return 'Истёк';
    case 'Terminated':
      return 'Расторгнут';
  }
}

export function getPeriodLocalizedName(period: LifePolicy['period']): string {
  switch (period) {
    case 'annual':
      return 'Раз в год';
    case 'semi-annual':
      return '2 раза в год';
    case 'quarterly':
      return '4 раза в год';
    case 'monthly':
      return 'Каждый месяц';
    case 'one-time':
      return 'Одноразовый';
  }
}

@Pipe({ name: 'policyTypeLocal', pure: true })
export class PolicyTypeLocalPipe implements PipeTransform {
  transform(value: Policy['type']) {
    return getTypeLocalizedName(value);
  }
}

@Pipe({ name: 'policyStatusLocal', pure: true })
export class PolicyStatusLocalPipe implements PipeTransform {
  transform(value: Policy['status']) {
    return getStatusLocalizedName(value);
  }
}

@Pipe({ name: 'backendPolicyTypeLocal', pure: true })
export class BackendPolicyTypeLocalPipe implements PipeTransform {
  transform(value: BackendPolicyType) {
    return getBackendTypeLocalizedName(value);
  }
}

@Pipe({ name: 'backendPolicyStatusLocal', pure: true })
export class BackendPolicyStatusLocalPipe implements PipeTransform {
  transform(value: BackendPolicyStatus) {
    return getBackendStatusLocalizedName(value);
  }
}

@Pipe({ name: 'policyPeriodLocal', pure: true })
export class PolicyPeriodLocalPipe implements PipeTransform {
  transform(value: LifePolicy['period']) {
    return getPeriodLocalizedName(value);
  }
}
