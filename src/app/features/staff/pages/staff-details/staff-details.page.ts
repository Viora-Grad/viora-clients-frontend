import { DatePipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NonNullableFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { StaffApi, UpdateStaffRequest, UpdateStaffRolesRequest } from '../../../../core/staff/apis/staff.api';
import { StaffDetail } from '../../../../core/staff/models/staff-detail.model';
import { Role } from '../../../../core/role/models/role.model';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

/* eslint-disable @typescript-eslint/naming-convention */
const STATUS_MAP: Record<string, { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' }> = {
	Active: { label: 'Active', severity: 'success' },
	Pending: { label: 'Pending', severity: 'warn' },
	Suspended: { label: 'Suspended', severity: 'danger' },
};
/* eslint-enable @typescript-eslint/naming-convention */

const GENDER_OPTIONS = [
	{ label: 'Male', value: 'Male' },
	{ label: 'Female', value: 'Female' },
];

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-staff-details',
	imports: [
		Button,
		Tag,
		DatePipe,
		FormsModule,
		ReactiveFormsModule,
		InputText,
		Password,
		Select,
		DatePicker,
		Dialog,
		Toast,
		MultiSelect,
	],
	providers: [MessageService],
	templateUrl: './staff-details.page.html',
	styleUrl: './staff-details.page.css',
})
export class StaffDetailsPage implements OnInit {
	private readonly _route = inject(ActivatedRoute);
	private readonly _staffApi = inject(StaffApi);
	private readonly _location = inject(Location);
	private readonly _router = inject(Router);
	private readonly _formBuilder = inject(NonNullableFormBuilder);
	private readonly _messageService = inject(MessageService);
	private readonly _tenantStore = inject(TenantStore);

	protected readonly staff = signal<StaffDetail | null>(null);
	protected readonly isLoading = signal(true);
	protected readonly error = signal<string | null>(null);
	protected readonly isEditing = signal(false);
	protected readonly isSaving = signal(false);
	protected readonly isDeleting = signal(false);
	protected readonly isDeleteDialogVisible = signal(false);
	protected readonly isRolesEditing = signal(false);
	protected readonly isSavingRoles = signal(false);
	protected readonly availableRoles = signal<Role[]>([]);
	protected readonly selectedRoleIds = signal<string[]>([]);

	protected readonly genderOptions = GENDER_OPTIONS;

	protected readonly editForm = this._formBuilder.group({
		firstName: [''],
		lastName: [''],
		dateOfBirth: [null as Date | null],
		gender: [''],
		phoneNumber: [''],
		username: [''],
		password: [''],
	});

	protected readonly staffInitials = (): string => {
		const s = this.staff();
		if (!s) return '';
		const first = s.firstName?.charAt(0) ?? '';
		const last = s.lastName?.charAt(0) ?? '';
		return (first + last).toUpperCase() || 'UN';
	};

	protected readonly staffFullName = (): string => {
		const s = this.staff();
		if (!s) return '';
		return `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || 'Unknown';
	};

	protected readonly roleNames = (): string[] => {
		const s = this.staff();
		if (!s) return [];
		return s.roles.map((r) => r.name);
	};

	protected readonly permissionNames = (): string[] => {
		const s = this.staff();
		if (!s) return [];
		const perms = new Set<string>();
		for (const role of s.roles) {
			for (const p of role.permissions) {
				perms.add(p.description ?? p.name);
			}
		}
		return [...perms];
	};

	protected readonly branchAddresses = (): string[] => {
		const s = this.staff();
		if (!s) return [];
		return s.branches.map((b) => {
			const addr = b.address;
			return `${addr.number} ${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}`.trim();
		});
	};

	protected readonly hasServices = (): boolean => {
		const s = this.staff();
		return !!s && s.services.length > 0;
	};

	private _staffId = '';

	public ngOnInit(): void {
		const id = this._route.snapshot.paramMap.get('id');
		if (!id) {
			this.error.set('Staff ID not found');
			this.isLoading.set(false);
			return;
		}
		this._staffId = id;
		void this._loadStaff(id);
	}

	protected goBack(): void {
		this._location.back();
	}

	protected getStatusInfo(status: string): { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' } {
		return STATUS_MAP[status] ?? { label: status, severity: 'secondary' };
	}

	protected getBranchStatus(status: string): { label: string; class: string } {
		if (status === 'Open') return { label: 'Open', class: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 bg-green-100 text-green-700' };
		return { label: 'Closed', class: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 bg-red-100 text-red-700' };
	}

	protected onEdit(): void {
		const s = this.staff();
		if (!s) return;

		let dob: Date | null = null;
		if (s.dateOfBirth) {
			const parts = s.dateOfBirth.split('T')[0].split('-');
			dob = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
		}

		this.editForm.reset({
			firstName: s.firstName ?? '',
			lastName: s.lastName ?? '',
			dateOfBirth: dob,
			gender: s.gender ?? '',
			phoneNumber: s.phoneNumber ?? '',
			username: s.username ?? '',
			password: '',
		});
		this.isEditing.set(true);
	}

	protected onCancelEdit(): void {
		this.isEditing.set(false);
		this.editForm.reset();
	}

	protected async onEditRoles(): Promise<void> {
		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		try {
			const roles = await firstValueFrom(this._staffApi.getRoles(organizationId));
			this.availableRoles.set(roles);

			const currentRoleIds = this.staff()?.roles.map((r) => r.id) ?? [];
			this.selectedRoleIds.set([...currentRoleIds]);

			this.isRolesEditing.set(true);
		} catch {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to load available roles',
			});
		}
	}

	protected onCancelEditRoles(): void {
		this.isRolesEditing.set(false);
		this.selectedRoleIds.set([]);
	}

	protected async onSaveRoles(): Promise<void> {
		this.isSavingRoles.set(true);

		try {
			const payload: UpdateStaffRolesRequest = {
				roleIds: this.selectedRoleIds(),
			};
			await firstValueFrom(this._staffApi.updateStaffRoles(this._staffId, payload));

			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Roles updated successfully',
			});

			this.isRolesEditing.set(false);
			await this._loadStaff(this._staffId);
		} catch (error: unknown) {
			this._showError(error, 'Failed to update roles');
		} finally {
			this.isSavingRoles.set(false);
		}
	}

	protected async onSave(): Promise<void> {
		if (this.editForm.invalid) return;

		this.isSaving.set(true);

		try {
			const payload = this._buildUpdatePayload();
			await firstValueFrom(this._staffApi.updateStaff(this._staffId, payload));

			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Staff details updated successfully',
			});

			this.isEditing.set(false);
			this.editForm.reset();
			await this._loadStaff(this._staffId);
		} catch (error: unknown) {
			this._showError(error, 'Failed to update staff details');
		} finally {
			this.isSaving.set(false);
		}
	}

	protected onDelete(): void {
		this.isDeleteDialogVisible.set(true);
	}

	protected onCancelDelete(): void {
		this.isDeleteDialogVisible.set(false);
	}

	protected async onConfirmDelete(): Promise<void> {
		this.isDeleting.set(true);

		try {
			await firstValueFrom(this._staffApi.deleteStaff(this._staffId));

			this._messageService.add({
				severity: 'success',
				summary: 'Deleted',
				detail: 'Staff member has been deleted',
			});

			this.isDeleteDialogVisible.set(false);

			setTimeout(() => {
				void this._router.navigate(['/staffs']);
			}, 800);
		} catch (error: unknown) {
			let message = 'Failed to delete staff member';
			if (error instanceof HttpErrorResponse) {
				const errorBody = error.error as { message?: string } | undefined;
				if (errorBody?.message) {
					message = errorBody.message;
				}
			}
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: message,
			});
		} finally {
			this.isDeleting.set(false);
		}
	}

	private _buildUpdatePayload(): UpdateStaffRequest {
		const formValue = this.editForm.getRawValue();
		return {
			firstName: formValue.firstName || null,
			lastName: formValue.lastName || null,
			username: formValue.username || null,
			password: formValue.password || null,
			dateOfBirth: formValue.dateOfBirth
				? `${formValue.dateOfBirth.getFullYear()}-${String(formValue.dateOfBirth.getMonth() + 1).padStart(2, '0')}-${String(formValue.dateOfBirth.getDate()).padStart(2, '0')}`
				: null,
			gender: formValue.gender || null,
			phoneNumber: formValue.phoneNumber || null,
		};
	}

	private _showError(error: unknown, fallback: string): void {
		let message = fallback;
		if (error instanceof HttpErrorResponse) {
			const errorBody = error.error as { message?: string } | undefined;
			if (errorBody?.message) {
				message = errorBody.message;
			}
		}
		this._messageService.add({
			severity: 'error',
			summary: 'Error',
			detail: message,
		});
	}

	private async _loadStaff(id: string): Promise<void> {
		try {
			const response = await firstValueFrom(this._staffApi.getStaffById(id));
			this.staff.set(response);
		} catch {
			this.error.set('Failed to load staff details');
		} finally {
			this.isLoading.set(false);
		}
	}
}
