import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AgentListItem {
  id: number;
  full_name: string;
  policy_count: number;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/agents`;

  getAll(search?: string): Observable<AgentListItem[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<AgentListItem[]>(this.url, { params });
  }
}
