import { Pipe, PipeTransform } from '@angular/core';
import {
  PolicyType,
  PolicyStatus,
  CarInsurancePeriodUnit,
  OsagoZone,
} from '../models/policy.model';

export function getPolicyTypeLocalizedName(type: PolicyType): string {
  switch (type) {
    case 'GreenCard':
      return 'Зелена карта';
    case 'Medassistance':
      return 'Медасистанс';
    case 'Osago':
      return 'ОСАГО';
  }
}

export function getPolicyStatusLocalizedName(status: PolicyStatus): string {
  switch (status) {
    case 'Active':
      return 'Активний';
    case 'Prolonged':
      return 'Пролонгований';
    case 'Rejected':
      return 'Відхилено';
    case 'Stopped':
      return 'Зупинено';
    case 'Postponed':
      return 'Відкладено';
    case 'Cancelled':
      return 'Розірвано';
    case 'Project':
      return 'Проєкт';
    case 'Replaced':
      return 'Замінено';
    case 'Expired':
      return 'Закінчився';
  }
}

export function getPolicyStatusSeverity(
  status: PolicyStatus,
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
      return 'днів';
    case 'Month':
      return 'місяців';
    case 'Year':
      return 'років';
  }
}

export function getOsagoZoneLocalizedName(zone: OsagoZone): string {
  switch (zone) {
    case 'Zone1':
      return 'Зона 1';
    case 'Zone2':
      return 'Зона 2';
    case 'Zone3':
      return 'Зона 3';
    case 'Zone4':
      return 'Зона 4';
    case 'Zone5':
      return 'Зона 5';
    case 'Outside':
      return 'Поза Україною';
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

@Pipe({ name: 'osagoZoneLocal', pure: true, standalone: true })
export class OsagoZoneLocalPipe implements PipeTransform {
  transform(value: OsagoZone) {
    return getOsagoZoneLocalizedName(value);
  }
}
