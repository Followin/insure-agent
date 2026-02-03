import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PolicyShort } from './policy.model';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/policies`;

  getAll(): Observable<PolicyShort[]> {
    return this.http.get<PolicyShort[]>(this.url);
  }
}
