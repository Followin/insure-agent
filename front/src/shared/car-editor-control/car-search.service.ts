import { Observable, map } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CarDto } from '../models/car.model';
import { environment } from '../../environments/environment';

interface CarSearchResult {
  id: number;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class CarSearchService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/cars`;

  public search(query: string): Observable<SelectOption<number>[]> {
    return this.http
      .get<CarSearchResult[]>(`${this.baseUrl}/search`, {
        params: { q: query },
      })
      .pipe(map((results) => results.map((r) => ({ value: r.id, label: r.label }))));
  }

  public getCar(id: number): Observable<CarDto | null> {
    return this.http.get<CarDto>(`${this.baseUrl}/${id}`);
  }
}
