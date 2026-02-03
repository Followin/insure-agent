import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreatePersonDto, PersonDto } from '../../shared/person-editor-control/person.model';


@Injectable({ providedIn: 'root' })
export class PersonService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/people`;

  getAll(): Observable<PersonDto[]> {
    return this.http.get<PersonDto[]>(this.url);
  }

  create(person: CreatePersonDto): Observable<PersonDto> {
    return this.http.post<PersonDto>(this.url, person);
  }
}
