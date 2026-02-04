import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreatePolicyRequest, CreatePolicyResponse } from './policy.model';

@Injectable({ providedIn: 'root' })
export class PolicyEditorService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/policies`;

  create(request: CreatePolicyRequest): Observable<CreatePolicyResponse> {
    return this.http.post<CreatePolicyResponse>(this.url, request);
  }
}
