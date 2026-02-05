import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../app/auth/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [ProgressSpinnerModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="text-center">
        <p-progressSpinner />
        <p class="mt-4 text-gray-600">Signing you in...</p>
        @if (error) {
          <p class="mt-2 text-red-600">{{ error }}</p>
        }
      </div>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  error: string | null = null;

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const errorParam = this.route.snapshot.queryParamMap.get('error');

    if (errorParam) {
      this.error = `Authentication failed: ${errorParam}`;
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    if (!code) {
      this.error = 'No authorization code received';
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    this.authService.handleCallback(code).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Authentication failed';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
    });
  }
}
