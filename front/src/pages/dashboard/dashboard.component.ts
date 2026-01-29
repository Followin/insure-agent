import { Component } from '@angular/core';
import { Person, Policy } from '../../data/data-model';
import { people, policies } from '../../data/data';
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
  public people: Person[] = people;
  public policies: Policy[] = policies;
  public apiResponse: Observable<string>;

  constructor(private http: HttpClient) {
    this.apiResponse = this.http.get(environment.apiUrl, { responseType: 'text' });
  }
}
