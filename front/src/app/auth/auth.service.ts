import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  isAuthenticated = signal(false);
  userEmail = signal<string | null>(null);
  private authChecked = signal(false);

  checkAuth(): Observable<boolean> {
    return this.http
      .get<AuthUser>(`${this.apiUrl}/auth/me`, { withCredentials: true })
      .pipe(
        tap((user) => {
          this.isAuthenticated.set(true);
          this.userEmail.set(user.email);
          this.authChecked.set(true);
        }),
        map(() => true),
        catchError(() => {
          this.isAuthenticated.set(false);
          this.userEmail.set(null);
          this.authChecked.set(true);
          return of(false);
        })
      );
  }

  loginWithGoogle(): void {
    const clientId = environment.googleClientId;
    const redirectUri = encodeURIComponent(environment.googleRedirectUri);
    const scope = encodeURIComponent('email profile');
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'consent';

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=${responseType}&` +
      `scope=${scope}&` +
      `access_type=${accessType}&` +
      `prompt=${prompt}`;

    window.location.href = authUrl;
  }

  handleCallback(code: string): Observable<AuthUser> {
    return this.http
      .post<AuthUser>(
        `${this.apiUrl}/auth/callback`,
        { code },
        { withCredentials: true }
      )
      .pipe(
        tap((user) => {
          this.isAuthenticated.set(true);
          this.userEmail.set(user.email);
        })
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.isAuthenticated.set(false);
          this.userEmail.set(null);
        })
      );
  }
}
