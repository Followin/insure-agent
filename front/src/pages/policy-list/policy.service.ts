import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PolicyShort } from '../../shared/models/policy.model';
import { PolicyTableFilter } from '../../shared/policy-table/policy-table.component';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/policies`;

  getAll(filter: PolicyTableFilter): Observable<PolicyShort[]> {
    let params = new HttpParams();
    if (filter.number) {
      params = params.set('number', filter.number);
    }
    if (filter.holder) {
      params = params.set('holder', filter.holder);
    }
    if (filter.car) {
      params = params.set('car', filter.car);
    }
    if (filter.startDate.from) {
      params = params.set('start_date_from', filter.startDate.from);
    }
    if (filter.startDate.to) {
      params = params.set('start_date_to', filter.startDate.to);
    }
    if (filter.endDate.from) {
      params = params.set('end_date_from', filter.endDate.from);
    }
    if (filter.endDate.to) {
      params = params.set('end_date_to', filter.endDate.to);
    }
    if (filter.policyTypes.length) {
      params = params.set('policy_types', filter.policyTypes.join(','));
    }
    if (filter.statuses.length) {
      params = params.set('statuses', filter.statuses.join(','));
    }
    return this.http.get<PolicyShort[]>(this.url, { params });
  }
}
