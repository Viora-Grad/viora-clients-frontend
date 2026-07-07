import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	inject,
	OnDestroy,
	OnInit,
	signal,
	viewChild,
	effect,
	untracked
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DatePipe } from '@angular/common';
import { OrganizationStore } from '../../store/organization.store';
import { OrganizationService } from '../../services/organization.service';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { MultiSelectModule } from 'primeng/multiselect';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';

@Component({
	selector: 'app-organization-edit',
	imports: [
		RouterLink,
		ReactiveFormsModule,
		ButtonModule,
		InputTextModule,
		TextareaModule,
		ChipModule,
		SkeletonModule,
		ToastModule,
		DatePipe,
		MultiSelectModule,
	],
	providers: [MessageService],
	templateUrl: './organizationEdit.page.html',
	styleUrl: './organizationEdit.page.css',
	changeDetection: ChangeDetectionStrategy.OnPush,

})

export class OrganizationEditPage implements OnInit, OnDestroy  {

	private readonly _router = inject(Router);
	protected readonly logoInputRef = viewChild<ElementRef<HTMLInputElement>>('logoInput');

	private readonly _route = inject(ActivatedRoute);
	private readonly _service = inject(OrganizationService);
	private readonly _messageService = inject(MessageService);
	private readonly _tenantStore = inject(TenantStore);
	protected selectedLogoFile: File | null = null;
	protected readonly serviceTypeOptions = signal<{ label: string; value: string }[]>([]);
	protected readonly store = inject(OrganizationStore);
	public readonly orgId = signal('');

	public readonly form = new FormGroup({
		// eslint-disable-next-line @typescript-eslint/unbound-method
		subDomain: new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]),
		// eslint-disable-next-line @typescript-eslint/unbound-method
		about: new FormControl('', [Validators.required]),
		// eslint-disable-next-line @typescript-eslint/unbound-method
		serviceDescription: new FormControl('', [Validators.required]),
		// eslint-disable-next-line @typescript-eslint/unbound-method
		supportEmail: new FormControl('', [Validators.required, Validators.email]),
		// eslint-disable-next-line @typescript-eslint/unbound-method
		billingEmail: new FormControl('', [Validators.required, Validators.email]),
		// eslint-disable-next-line @typescript-eslint/unbound-method
		servicesProvided: new FormControl<string[] | null>([], [Validators.required]),
	});


	public get servicesProvidedControl(): FormControl<string[] | null> {
		return this.form.controls.servicesProvided;
	}

	public ngOnInit(): void {
		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) {
			this._messageService.add({ severity: 'error', summary: 'Error', detail: 'Organization ID not found' });
			return;
		}
		this.orgId.set(organizationId);

		this._service.loadOrganization(organizationId).subscribe({
			next: () => this._patchForm(),
			error: () => this._messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load organization' }),
		});

		this._service.getservicesProvided().subscribe({
			next: (types) =>
				this.serviceTypeOptions.set(
					types.map(type => ({
						label: type,
						value: type,
					}))
				),
		});

		// console.log('Organization Logo URL:', this.store.logoUrl());
	}

	public constructor() {
		effect(() => {
			const error = this.store.error();
			if (!error) return;

			untracked(() => {
				this._messageService.add({ severity: 'error', summary: 'Error', detail: error });
			});
		});
	}
	

	public ngOnDestroy(): void {
		this.store.reset();
	}

	private _patchForm(): void {
		const org = this.store.organization();
		if (!org) return;
		this.form.patchValue({
			subDomain: org.subDomain ?? '',
			about: org.about,
			serviceDescription: org.serviceDescription,
			supportEmail: org.contactEmail,
			billingEmail: org.contactEmail,
			servicesProvided: org.servicesProvided ?? [],
		});
	}

	public onSubDomainInput(): void {
		const value = this.form.controls.subDomain.value ?? '';
		const current = this.store.organization()?.subDomain ?? '';
		this._service.checkSubDomain(value, current);
	}

	public onLogoClick(): void {
		this.logoInputRef()?.nativeElement.click();
	}

	public onLogoSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		this.selectedLogoFile = file;
		this.store.setLogoUrl(URL.createObjectURL(file));

		// this._service.uploadLogo(this.orgId(), file);
		input.value = '';
	}



	public onSave(): void {
	if (this.form.invalid) {
		this.form.markAllAsTouched();
		return;
	}

	if (this.store.subDomainAvailable() === false) return;

	const raw = this.form.getRawValue();

	const update$ = this._service.updateOrganization(this.orgId(), {
		subDomain: raw.subDomain ?? '',
		about: raw.about ?? '',
		serviceDescription: raw.serviceDescription ?? '',
		supportEmail: raw.supportEmail ?? '',
		billingEmail: raw.billingEmail ?? '',
		servicesProvided: raw.servicesProvided ?? [],
	});

	const logo$ = this.selectedLogoFile? this._service.uploadLogo(this.orgId(), this.selectedLogoFile): of(null);

	forkJoin([update$, logo$]).subscribe({
		next: () => {
			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Profile updated successfully.',
			});

			void this._router.navigate(['..'], {relativeTo: this._route,});
		},
		error: () => {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to update profile.',
			});
		},
	});
}

	public isSubDomainTaken(): boolean {
		return this.store.subDomainAvailable() === false;
	}
}