import { Pipe, PipeTransform } from '@angular/core';
import { PolicyType, PolicyStatus } from '../models/policy.model';

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
    case 'Expired':
      return 'Истёк';
    case 'Terminated':
      return 'Расторгнут';
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
