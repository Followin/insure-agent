import { Observable, of } from 'rxjs';
import { cars } from '../../data/data';
import { Injectable } from '@angular/core';
import { Car } from '../../data/data-model';

@Injectable({ providedIn: 'root' })
export class CarSearchService {
  public search(query: string): Observable<AutocompleteSugggestion<number>[]> {
    const result = cars
      .filter((car) =>
        `${car.plate.toLowerCase()} ${car.make.toLowerCase()} ${car.model.toLowerCase()}`.includes(
          query.toLowerCase(),
        ),
      )
      .map((car) => ({
        value: car.id,
        label: `${car.plate} (${car.make} ${car.model})`,
      }));

    return of(result);
  }

  public getCar(id: number): Observable<Car | null> {
    return of(cars.find((car) => car.id === id) || null);
  }
}
