import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreatePolicyRequest,
  CreatePolicyResponse,
  PolicyFull,
  UpdatePolicyRequest,
} from './policy.model';

@Injectable({ providedIn: 'root' })
export class PolicyEditorService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/policies`;

  getById(id: number): Observable<PolicyFull> {
    return this.http.get<PolicyFull>(`${this.url}/${id}`);
  }

  create(request: CreatePolicyRequest): Observable<CreatePolicyResponse> {
    return this.http.post<CreatePolicyResponse>(this.url, request);
  }

  update(id: number, request: UpdatePolicyRequest): Observable<PolicyFull> {
    return this.http.put<PolicyFull>(`${this.url}/${id}`, request);
  }
}
