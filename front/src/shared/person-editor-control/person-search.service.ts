import { Observable, of } from 'rxjs';
import { people } from '../../data/data';
import { Injectable } from '@angular/core';
import { Person } from '../../data/data-model';

@Injectable({ providedIn: 'root' })
export class PersonSearchService {
  public search(name: string): Observable<AutocompleteSugggestion<number>[]> {
    const result = people
      .filter((person) =>
        `${person.firstName.toLowerCase()} ${person.lastName.toLowerCase()}`.includes(
          name.toLowerCase(),
        ),
      )
      .map((person) => ({
        value: person.id,
        label: `${person.firstName} ${person.lastName}`,
      }));

    return of(result);
  }

  public getPerson(id: number): Observable<Person | null> {
    return of(people.find((person) => person.id === id) || null);
  }
}
