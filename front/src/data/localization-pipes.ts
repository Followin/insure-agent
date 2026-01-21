import { Pipe, PipeTransform } from '@angular/core';
import { LifePolicy, Policy } from './data-model';

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

@Pipe({ name: 'policyPeriodLocal', pure: true })
export class PolicyPeriodLocalPipe implements PipeTransform {
  transform(value: LifePolicy['period']) {
    return getPeriodLocalizedName(value);
  }
}
