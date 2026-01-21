import { Routes } from '@angular/router';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { PolicyListComponent } from '../pages/policy-list/policy-list.component';
import { PolicyEditorComponent } from '../pages/policy-editor/policy-editor.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'policies', component: PolicyListComponent },
  { path: 'policies/new', component: PolicyEditorComponent },
];
