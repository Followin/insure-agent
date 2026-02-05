import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Add withCredentials to all requests
  const authReq = req.clone({
    withCredentials: true,
  });

  return next(authReq).pipe(
    catchError((error) => {
      // Redirect to login on 401, but not for auth endpoints
      if (error.status === 401 && !req.url.includes('/auth/')) {
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
