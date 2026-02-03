import { Injectable } from '@angular/core';
import { CreatePolicyRequest } from './create-policy-request';
import { Observable, of } from 'rxjs';
import { cars, people, policies } from '../../data/data';
import { Car, Person } from '../../data/data-model';
import { CreatePersonDto } from '../../shared/person-editor-control/person.model';

function mapNewPerson(dto: CreatePersonDto, id: number): Person {
  return {
    id,
    firstName: dto.first_name,
    lastName: dto.last_name,
    sex: dto.sex,
    birthDate: new Date(dto.birth_date),
    taxNumber: dto.tax_number,
    phone: dto.phone,
    phone2: dto.phone2,
    email: dto.email,
  };
}

@Injectable({
  providedIn: 'root',
})
export class CreatePolicyService {
  public createPolicy(request: CreatePolicyRequest): Observable<void> {
    const lastPolicyId = Math.max(...policies.map((x) => x.id));

    if (!request.holder) throw new Error('Holder is required');

    let holder: Person;

    if (request.holder.type === 'existing') {
      const id = request.holder.id;
      holder = people.find((x) => x.id === id)!;
    } else {
      const lastPersonId = Math.max(...people.map((x) => x.id));
      holder = mapNewPerson(request.holder.person, lastPersonId + 1);
      people.push(holder);
    }

    if (request.type === 'life') {
      if (!request.insured) throw new Error('Insured is required');

      let insured: Person;

      if (request.insured.type === 'existing') {
        const id = request.insured.id;
        insured = people.find((x) => x.id === id)!;
      } else {
        const lastPersonId = Math.max(...people.map((x) => x.id));
        insured = mapNewPerson(request.insured.person, lastPersonId + 1);
        people.push(insured);
      }

      policies.push({
        id: lastPolicyId + 1,
        ...request,
        holder,
        insured,
      });
    } else if (request.type === 'green-card') {
      let car: Car;

      if (request.car.type === 'existing') {
        const id = request.car.id;
        car = cars.find((x) => x.id === id)!;
      } else {
        const lastCarId = Math.max(...cars.map((x) => x.id));
        car = {
          ...request.car.car,
          id: lastCarId + 1,
        };
        cars.push(car);
      }

      policies.push({
        id: lastPolicyId + 1,
        ...request,
        holder,
        car,
      });
    }

    return of();
  }
}
