import { Component } from '@angular/core';
import { sharedImports } from '../../shared/shared-imports';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [sharedImports],
})
export class DashboardComponent {
  public people = [];
  public policies = [];
  public apiResponse: Observable<string>;

  constructor(private http: HttpClient) {
    this.apiResponse = this.http.get(environment.apiUrl, { responseType: 'text' });
  }
}
