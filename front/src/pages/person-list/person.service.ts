import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreatePersonDto, PersonDto } from '../../shared/person-editor-control/person.model';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/people`;

  getAll(search?: string): Observable<PersonDto[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PersonDto[]>(this.url, { params });
  }

  getById(id: number): Observable<PersonDto> {
    return this.http.get<PersonDto>(`${this.url}/${id}`);
  }

  create(person: CreatePersonDto): Observable<PersonDto> {
    return this.http.post<PersonDto>(this.url, person);
  }

  update(id: number, person: CreatePersonDto): Observable<PersonDto> {
    return this.http.put<PersonDto>(`${this.url}/${id}`, person);
  }
}
