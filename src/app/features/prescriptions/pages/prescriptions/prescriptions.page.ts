import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { PrescriptionTemplateService } from '../../services/prescription-template.service';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-prescriptions',
	imports: [Button, RouterLink],
	templateUrl: './prescriptions.page.html',
	styleUrl: './prescriptions.page.css',
})
export class PrescriptionsPage implements OnInit {
	protected readonly templateService = inject(PrescriptionTemplateService);
	private readonly _tenantStore = inject(TenantStore);

	public ngOnInit(): void {
		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;
		void this.templateService.loadTemplates(organizationId);
	}
}
