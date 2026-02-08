import { Pipe, PipeTransform } from '@angular/core';
import { Sex } from '../person-editor-control/person.model';

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

@Pipe({ name: 'sexLocal', pure: true, standalone: true })
export class SexLocalPipe implements PipeTransform {
  transform(value: Sex) {
    return getSexLocalizedName(value);
  }
}
