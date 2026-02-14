import { Pipe, PipeTransform } from '@angular/core';
import { PersonStatus, Sex } from '../person-editor-control/person.model';

export function getSexLocalizedName(sex: Sex): string {
  switch (sex) {
    case 'M':
      return 'Мужской';
    case 'F':
      return 'Женский';
    case 'Unknown':
      return 'Неизвестно';
  }
}

export function getPersonStatusLocalizedName(status: PersonStatus): string {
  switch (status) {
    case 'Active':
      return 'Активный';
    case 'Inactive':
      return 'Неактивный';
    case 'Archived':
      return 'Архивирован';
  }
}

export function getPersonStatusSeverity(
  status: PersonStatus
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Inactive':
      return 'warn';
    case 'Archived':
      return 'secondary';
  }
}

@Pipe({ name: 'sexLocal', pure: true, standalone: true })
export class SexLocalPipe implements PipeTransform {
  transform(value: Sex) {
    return getSexLocalizedName(value);
  }
}

@Pipe({ name: 'personStatusLocal', pure: true, standalone: true })
export class PersonStatusLocalPipe implements PipeTransform {
  transform(value: PersonStatus) {
    return getPersonStatusLocalizedName(value);
  }
}

@Pipe({ name: 'personStatusSeverity', pure: true, standalone: true })
export class PersonStatusSeverityPipe implements PipeTransform {
  transform(value: PersonStatus) {
    return getPersonStatusSeverity(value);
  }
}
