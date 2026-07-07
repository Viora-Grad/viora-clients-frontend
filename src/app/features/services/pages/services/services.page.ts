import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { Service } from '../../models/services.model';
import { ServicesService } from '../../services/services.service';

/* eslint-disable @typescript-eslint/naming-convention */
const STATUS_MAP: Record<string, { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' }> = {
	Active: { label: 'Active', severity: 'success' },
	Hidden: { label: 'Hidden', severity: 'warn' },
	Disabled: { label: 'Disabled', severity: 'danger' },
};
/* eslint-enable @typescript-eslint/naming-convention */

function requiredValidator(): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => Validators.required(control);
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-services',
	imports: [
		Button,
		Tag,
		Dialog,
		ReactiveFormsModule,
		InputText,
		Textarea,
		Select,
		Toast,
	],
	providers: [MessageService],
	templateUrl: './services.page.html',
	styleUrl: './services.page.css',
})
export class ServicesPage implements OnInit {
	protected readonly servicesService = inject(ServicesService);
	private readonly _branchStore = inject(BranchStore);
	private readonly _formBuilder = inject(NonNullableFormBuilder);
	private readonly _messageService = inject(MessageService);
	private readonly _router = inject(Router);

	protected readonly isCreateDialogVisible = signal(false);
	protected readonly isEditDialogVisible = signal(false);
	protected readonly isDiscountDialogVisible = signal(false);
	protected readonly isSubmitting = signal(false);

	protected readonly editingService = signal<Service | null>(null);

	protected readonly durationOptions = Array.from({ length: 48 }, (unused, i) => ({
		label: `${(i + 1) * 10} min`,
		value: String((i + 1) * 10),
	}));

	protected readonly createForm = this._formBuilder.group({
		name: ['', requiredValidator()],
		description: ['', requiredValidator()],
		serviceType: ['', requiredValidator()],
		durationInMinutes: ['', requiredValidator()],
		costAmount: ['', requiredValidator()],
	});

	protected readonly editForm = this._formBuilder.group({
		name: ['', requiredValidator()],
		description: ['', requiredValidator()],
		serviceType: ['', requiredValidator()],
		durationInMinutes: ['', requiredValidator()],
		costAmount: ['', requiredValidator()],
	});

	protected readonly discountForm = this._formBuilder.group({
		discountOutOf100: ['', requiredValidator()],
		reason: ['', requiredValidator()],
		durationInDays: ['', requiredValidator()],
	});

	private get _currentBranchId(): string {
		return this._branchStore.currentBranchId() ?? '';
	}

	public ngOnInit(): void {
		const branchId = this._currentBranchId;
		if (branchId) {
			void this.servicesService.loadServices(branchId);
		}
		void this.servicesService.loadServiceTypes();
	}

	protected getStatusInfo(status: string): { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' } {
		return STATUS_MAP[status] ?? { label: status, severity: 'secondary' };
	}

	protected openCreateDialog(): void {
		this.createForm.reset();
		this.isCreateDialogVisible.set(true);
	}

	protected openEditDialog(service: Service): void {
		this.editingService.set(service);
		this.editForm.reset({
			name: service.name,
			description: service.description,
			serviceType: service.serviceType,
			durationInMinutes: service.durationMinutes,
			costAmount: service.cost,
		});
		this.isEditDialogVisible.set(true);
	}

	protected openDiscountDialog(service: Service): void {
		this.editingService.set(service);
		this.discountForm.reset();
		this.isDiscountDialogVisible.set(true);
	}

	protected openFormBuilder(serviceId: string): void {
		void this._router.navigate(['/branch-management/services', serviceId, 'form']);
	}

	protected async onSubmitCreate(): Promise<void> {
		if (this.createForm.invalid) return;

		this.isSubmitting.set(true);
		const formValue = this.createForm.getRawValue();
		const success = await this.servicesService.createService({
			branchId: this._currentBranchId,
			name: formValue.name,
			description: formValue.description,
			serviceType: formValue.serviceType,
			durationInMinutes: formValue.durationInMinutes,
			costAmount: formValue.costAmount,
			currency: 'EGP',
		});
		this.isSubmitting.set(false);

		if (success) {
			this._messageService.add({ severity: 'success', summary: 'Success', detail: 'Service created successfully' });
			this.isCreateDialogVisible.set(false);
		} else {
			this._messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create service' });
		}
	}

	protected async onSubmitEdit(): Promise<void> {
		if (this.editForm.invalid) return;

		const service = this.editingService();
		if (!service) return;

		this.isSubmitting.set(true);
		const formValue = this.editForm.getRawValue();
		const success = await this.servicesService.updateService(
			service.id,
			{
				name: formValue.name,
				description: formValue.description,
				serviceType: formValue.serviceType,
				durationInMinutes: formValue.durationInMinutes,
				costAmount: formValue.costAmount,
				currency: 'EGP',
			},
			this._currentBranchId,
		);
		this.isSubmitting.set(false);

		if (success) {
			this._messageService.add({ severity: 'success', summary: 'Success', detail: 'Service updated successfully' });
			this.isEditDialogVisible.set(false);
		} else {
			this._messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update service' });
		}
	}

	protected async onSubmitDiscount(): Promise<void> {
		if (this.discountForm.invalid) return;

		const service = this.editingService();
		if (!service) return;

		this.isSubmitting.set(true);
		const formValue = this.discountForm.getRawValue();
		const success = await this.servicesService.addDiscount(
			service.id,
			{
				discountOutOf100: formValue.discountOutOf100,
				reason: formValue.reason,
				durationInDays: formValue.durationInDays,
			},
			this._currentBranchId,
		);
		this.isSubmitting.set(false);

		if (success) {
			this._messageService.add({ severity: 'success', summary: 'Success', detail: 'Discount added successfully' });
			this.isDiscountDialogVisible.set(false);
		} else {
			this._messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add discount' });
		}
	}
}
