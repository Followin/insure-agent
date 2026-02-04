import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { CarDto } from '../models/car.model';

// TODO: Replace with actual backend data when car endpoints are available
const mockCars: CarDto[] = [];

@Injectable({ providedIn: 'root' })
export class CarSearchService {
  public search(query: string): Observable<AutocompleteSugggestion<number>[]> {
    const result = mockCars
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

  public getCar(id: number): Observable<CarDto | null> {
    return of(mockCars.find((car) => car.id === id) || null);
  }
}
