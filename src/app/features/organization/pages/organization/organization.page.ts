import {
	ChangeDetectionStrategy,
	Component,
	OnInit,
	computed,
	inject,
	signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { OrganizationStore } from '../../store/organization.store';
import { OrganizationService } from '../../services/organization.service';
import { MessageService } from 'primeng/api';
import {DatePipe} from "@angular/common";

@Component({
	selector: 'app-organization-page',
	imports: [
    ButtonModule,
    CardModule,
    ChipModule,
    DividerModule,
    ProgressSpinnerModule,
	DatePipe,
    
],
	templateUrl: './organization.page.html',
	styleUrl: './organization.page.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationPage implements OnInit {
	private readonly _tenantStore = inject(TenantStore);
	private readonly _organizationService = inject(OrganizationService);
	private readonly _organizationStore = inject(OrganizationStore);
	private readonly _router = inject(Router);
	private readonly _messageService = inject(MessageService);


	protected readonly organization =
		this._organizationStore.organization;

	protected readonly logoUrl = this._organizationStore.logoUrl;

	protected readonly loading = signal(true);

	protected readonly branches = computed(
		() => this.organization()?.branches ?? [],
	);

	public ngOnInit(): void {
		const organizationId = this._tenantStore.organizationId();

		if (!organizationId) return;

		this._organizationService.loadOrganization(organizationId).subscribe({
			next: () => {
				this.loading.set(false);
			},
		});
	}

	protected async edit(): Promise<void> {
		await this._router.navigate(['organization/edit']);
	}
}