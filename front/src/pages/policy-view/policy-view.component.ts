import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { sharedImports } from '../../shared/shared-imports';
import { PolicyEditorService } from '../policy-editor/policy.service';
import { PolicyFull } from '../policy-editor/policy.model';
import { fakeLoadingDelay } from '../../shared/shared-delay';
import { delay } from 'rxjs';

@Component({
  selector: 'app-policy-view',
  templateUrl: './policy-view.component.html',
  imports: [sharedImports],
})
export class PolicyViewComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private policyService = inject(PolicyEditorService);

  public policy = signal<PolicyFull | null>(null);
  public loading = signal(true);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.policyService
      .getById(id)
      .pipe(delay(fakeLoadingDelay))
      .subscribe({
        next: (policy) => {
          this.policy.set(policy);
          this.loading.set(false);
        },
        error: () => {
          this.router.navigate(['/policies']);
        },
      });
  }
}
