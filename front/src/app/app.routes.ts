import { Routes } from '@angular/router';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { PolicyListComponent } from '../pages/policy-list/policy-list.component';
import { PolicyEditorComponent } from '../pages/policy-editor/policy-editor.component';
import { PolicyViewComponent } from '../pages/policy-view/policy-view.component';
import { PersonListComponent } from '../pages/person-list/person-list.component';
import { PersonEditorComponent } from '../pages/person-editor/person-editor.component';
import { LoginComponent } from '../pages/login/login.component';
import { AuthCallbackComponent } from '../pages/auth-callback/auth-callback.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'policies', component: PolicyListComponent },
      { path: 'policies/new', component: PolicyEditorComponent },
      { path: 'policies/:id', component: PolicyViewComponent },
      { path: 'policies/:id/edit', component: PolicyEditorComponent },
      { path: 'people', component: PersonListComponent },
      { path: 'people/new', component: PersonEditorComponent },
    ],
  },
];
