import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BranchApi } from '../../../../core/branch/apis/branch.api';
import { Country } from '../../../../core/branch/models/country.model';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

function requiredValidator(): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => Validators.required(control);
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-create-branch',
	imports: [ReactiveFormsModule, Button, Checkbox, InputText, Select, Toast],
	templateUrl: './create-branch.page.html',
	styleUrl: './create-branch.page.css',
})
export class CreateBranchPage implements OnInit {
	private readonly _formBuilder = inject(NonNullableFormBuilder);
	private readonly _branchApi = inject(BranchApi);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _router = inject(Router);
	private readonly _location = inject(Location);
	private readonly _messageService = inject(MessageService);

	protected readonly countries = signal<Country[]>([]);
	protected readonly serviceTypes = signal<string[]>([]);
	protected readonly isLoading = signal(false);
	protected readonly isSubmitting = signal(false);

	protected readonly form = this._formBuilder.group({
		addressNumber: ['', requiredValidator()],
		addressStreet: ['', requiredValidator()],
		addressCity: ['', requiredValidator()],
		addressState: ['', requiredValidator()],
		addressCountryId: ['', requiredValidator()],
		addressPostalCode: ['', requiredValidator()],
		latitude: [''],
		longitude: [''],
		contactEmail: [''],
		servicesProvided: this._formBuilder.array<boolean[]>([]),
	});

	protected get servicesArray(): FormArray<FormControl<boolean>> {
		return this.form.get('servicesProvided') as FormArray<FormControl<boolean>>;
	}

	public ngOnInit(): void {
		this._loadCountries();
		this._loadServiceTypes();
	}

	protected goBack(): void {
		this._location.back();
	}

	protected onSubmit(): void {
		if (this.form.invalid) return;

		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		const { addressNumber, addressStreet, addressCity, addressState, addressCountryId, addressPostalCode, latitude, longitude, contactEmail } = this.form.getRawValue();

		const selectedServices = this.serviceTypes()
			.filter((name, index) => this.servicesArray.at(index)?.value);

		this.isSubmitting.set(true);

		this._branchApi.createBranch({
			organizationId,
			addressNumber,
			addressStreet,
			addressCity,
			addressState,
			addressCountryId,
			addressPostalCode,
			latitude: latitude || '',
			longitude: longitude || '',
			contactEmail: contactEmail || '',
			servicesProvided: selectedServices,
			timeZoneId: 'utc',
		}).subscribe({
			next: () => {
				this._messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Branch created successfully',
				});
				setTimeout(() => {
					void this._router.navigate(['/branches']);
				}, 1000);
			},
			error: () => {
				this.isSubmitting.set(false);
				this._messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to create branch',
				});
			},
		});
	}

	private _loadCountries(): void {
		this.isLoading.set(true);
		this._branchApi.getCountries().subscribe({
			next: (countries) => {
				this.countries.set(countries);
				this.isLoading.set(false);
			},
			error: () => {
				this.isLoading.set(false);
			},
		});
	}

	private _loadServiceTypes(): void {
		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		this.isLoading.set(true);
		this._branchApi.getOrganizationServices(organizationId).subscribe({
			next: (serviceTypes) => {
				this.serviceTypes.set(serviceTypes);
				const controls = serviceTypes.map(() => this._formBuilder.control(false));
				this.form.setControl('servicesProvided', this._formBuilder.array(controls));
				this.isLoading.set(false);
			},
			error: () => {
				this.isLoading.set(false);
			},
		});
	}
}
