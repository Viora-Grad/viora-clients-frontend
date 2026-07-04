import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
	FormArray,
	FormControl,
	NonNullableFormBuilder,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { Permission } from '../../../../core/auth/models/permission.model';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../core/role/services/role.service';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-create-role',
	imports: [ReactiveFormsModule, Button, Checkbox, InputText, Textarea, Toast],
	templateUrl: './create-role.page.html',
	styleUrl: './create-role.page.css',
})
export class CreateRolePage implements OnInit {
	private readonly _formBuilder = inject(NonNullableFormBuilder);
	private readonly _authService = inject(AuthService);
	private readonly _roleService = inject(RoleService);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _router = inject(Router);
	private readonly _location = inject(Location);
	private readonly _messageService = inject(MessageService);

	protected readonly permissions = signal<Permission[]>([]);
	protected readonly isLoading = signal(false);
	protected readonly isSubmitting = signal(false);

	protected readonly form = this._formBuilder.group({
		// eslint-disable-next-line @typescript-eslint/unbound-method
		roleName: ['', Validators.required],
		roleDescription: [''],
		permissionsIds: this._formBuilder.array<boolean[]>([]),
	});

	protected get permissionsArray(): FormArray<FormControl<boolean>> {
		return this.form.get('permissionsIds') as FormArray<FormControl<boolean>>;
	}

	public ngOnInit(): void {
		this._loadPermissions();
	}

	protected goBack(): void {
		this._location.back();
	}

	protected onSubmit(): void {
		if (this.form.invalid) return;

		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		const { roleName, roleDescription } = this.form.getRawValue();
		const selectedPermissionIds = this.permissions()
			// eslint-disable-next-line @typescript-eslint/naming-convention
			.filter((_, index) => this.permissionsArray.at(index)?.value)
			.map((p) => String(p.id));

		this.isSubmitting.set(true);

		this._roleService
			.createRole(organizationId, {
				roleName,
				roleDescription: roleDescription || null,
				permissionsIds: selectedPermissionIds,
			})
			.subscribe({
				next: () => {
					this._messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Role created successfully',
					});
					setTimeout(() => {
						void this._router.navigate(['/roles']);
					}, 1000);
				},
				error: () => {
					this.isSubmitting.set(false);
					this._messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to create role',
					});
				},
			});
	}

	private _loadPermissions(): void {
		this.isLoading.set(true);
		this._authService.getPermissions().subscribe({
			next: (permissions) => {
				this.permissions.set(permissions);
				const controls = permissions.map(() => this._formBuilder.control(false));
				this.form.setControl('permissionsIds', this._formBuilder.array(controls));
				this.isLoading.set(false);
			},
			error: () => {
				this.isLoading.set(false);
			},
		});
	}
}
