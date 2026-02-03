import { Observable, map } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PersonDto } from './person.model';
import { environment } from '../../environments/environment';

interface PersonSearchResult {
  id: number;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class PersonSearchService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/people`;

  public search(name: string): Observable<AutocompleteSugggestion<number>[]> {
    return this.http
      .get<PersonSearchResult[]>(`${this.baseUrl}/search`, {
        params: { q: name },
      })
      .pipe(
        map((results) =>
          results.map((r) => ({ value: r.id, label: r.label })),
        ),
      );
  }

  public getPerson(id: number): Observable<PersonDto | null> {
    return this.http.get<PersonDto>(`${this.baseUrl}/${id}`);
  }
}
