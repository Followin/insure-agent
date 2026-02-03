import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { sharedImports } from '../../shared/shared-imports';
import { PolicyService } from './policy.service';
import { delay } from 'rxjs';
import { fakeLoadingDelay } from '../../shared/shared-delay';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-list.component.html',
  imports: [sharedImports],
})
export class PolicyListComponent {
  private policyService = inject(PolicyService);
  public policies = toSignal(this.policyService.getAll().pipe(delay(fakeLoadingDelay)));
  public skeletonRows = Array(13).fill({});
}
