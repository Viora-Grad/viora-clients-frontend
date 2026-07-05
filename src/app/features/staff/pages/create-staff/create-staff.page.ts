import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Toast } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import { BranchApiResponse } from '../../../../core/branch/dtos/branch.dto';
import { Role } from '../../../../core/role/models/role.model';
import { StaffInvitationApi } from '../../../../core/staff/apis/staff-invitation.api';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-create-staff',
	imports: [ReactiveFormsModule, Button, MultiSelect, InputText, Toast, RouterLink],
	templateUrl: './create-staff.page.html',
	styleUrl: './create-staff.page.css',
})
export class CreateStaffPage implements OnInit {
	private readonly _formBuilder = inject(NonNullableFormBuilder);
	private readonly _staffInvitationApi = inject(StaffInvitationApi);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _location = inject(Location);
	private readonly _messageService = inject(MessageService);

	protected readonly roles = signal<Role[]>([]);
	protected readonly branches = signal<BranchApiResponse[]>([]);
	protected readonly isLoading = signal(false);
	protected readonly isSubmitting = signal(false);
	protected readonly invitationLink = signal<string | null>(null);

	protected readonly form = this._formBuilder.group({
		// eslint-disable-next-line @typescript-eslint/unbound-method
		branchIds: [[] as string[], Validators.required],
		// eslint-disable-next-line @typescript-eslint/unbound-method
		roleIds: [[] as string[], Validators.required],
	});

	public ngOnInit(): void {
		void this._loadData();
	}

	protected goBack(): void {
		this._location.back();
	}

	protected copyLink(): void {
		const link = this.invitationLink();
		if (link) {
			void navigator.clipboard.writeText(link);
		}
	}

	protected async onSubmit(): Promise<void> {
		if (this.form.invalid) return;

		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		this.isSubmitting.set(true);

		try {
			const { branchIds, roleIds } = this.form.getRawValue();
			const token = await firstValueFrom(
				this._staffInvitationApi.createInvitation(organizationId, { branchIds, roleIds }),
			);
			const base = window.location.origin;
			this.invitationLink.set(`${base}/staffs/create?invitationToken=${encodeURIComponent(token)}`);
			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Invitation created successfully',
			});
		} catch {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to create invitation',
			});
		} finally {
			this.isSubmitting.set(false);
		}
	}

	private async _loadData(): Promise<void> {
		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		this.isLoading.set(true);

		try {
			const roles$ = this._staffInvitationApi.getRoles(organizationId);
			const branches$ = this._staffInvitationApi.getBranches(organizationId);
			const [roles, branchResponse] = await Promise.all([
				firstValueFrom(roles$),
				firstValueFrom(branches$),
			]);
			this.roles.set(roles);
			this.branches.set(branchResponse.items);
		} catch {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to load roles and branches',
			});
		} finally {
			this.isLoading.set(false);
		}
	}
}
