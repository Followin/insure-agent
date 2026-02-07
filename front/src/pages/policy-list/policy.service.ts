import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PolicyShort } from './policy.model';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/policies`;

  getAll(search?: string, activeOnly?: boolean): Observable<PolicyShort[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (activeOnly) {
      params = params.set('active_only', 'true');
    }
    return this.http.get<PolicyShort[]>(this.url, { params });
  }
}
