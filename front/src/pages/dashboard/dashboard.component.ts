import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { sharedImports } from '../../shared/shared-imports';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [sharedImports],
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);

  public loading = true;
  public skeletonRows = Array(5).fill({});

  public stats = toSignal(
    this.dashboardService.getStats().pipe(
      tap(() => (this.loading = false))
    )
  );
}
