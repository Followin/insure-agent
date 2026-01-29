import { Injectable } from '@angular/core';
import { CreatePolicyRequest } from './create-policy-request';
import { Observable, of } from 'rxjs';
import { cars, people, policies } from '../../data/data';
import { Car, Person } from '../../data/data-model';

@Injectable({
  providedIn: 'root',
})
export class CreatePolicyService {
  public createPolicy(request: CreatePolicyRequest): Observable<void> {
    const lastPolicyId = Math.max(...policies.map((x) => x.id));

    let holder: Person;

    if (request.holder.type === 'existing') {
      const id = request.holder.id;
      holder = people.find((x) => x.id === id)!;
    } else {
      const lastPersonId = Math.max(...people.map((x) => x.id));
      holder = {
        ...request.holder.person,
        id: lastPersonId + 1,
      };
      people.push(holder);
    }

    if (request.type === 'life') {
      let insured: Person;

      if (request.insured.type === 'existing') {
        const id = request.insured.id;
        insured = people.find((x) => x.id === id)!;
      } else {
        const lastPersonId = Math.max(...people.map((x) => x.id));
        insured = {
          ...request.insured.person,
          id: lastPersonId + 1,
        };
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
