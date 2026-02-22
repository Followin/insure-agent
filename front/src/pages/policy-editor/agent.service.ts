import { Observable } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Agent } from '../../shared/models/agent.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AgentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/agents`;

  public getAll(): Observable<Agent[]> {
    return this.http.get<Agent[]>(this.baseUrl);
  }
}
