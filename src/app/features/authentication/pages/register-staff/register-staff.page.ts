import { HttpErrorResponse } from '@angular/common/http';
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
	signal,
} from '@angular/core';
import {
	AbstractControl,
	AsyncValidatorFn,
	NonNullableFormBuilder,
	ReactiveFormsModule,
	ValidationErrors,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import { RegisterStaffApi } from '../../../../core/staff/apis/register-staff.api';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

const GENDER_OPTIONS = [
	{ label: 'Male', value: 'Male' },
	{ label: 'Female', value: 'Female' },
];

function strongPasswordValidator(): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const value = control.value as string;
		if (!value) return null;

		const errors: ValidationErrors = {};
		if (value.length < 8) {
			errors['minLength'] = true;
		}
		if (!/[A-Z]/.test(value)) {
			errors['noCapital'] = true;
		}
		if (!/[0-9]/.test(value)) {
			errors['noNumber'] = true;
		}
		if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value)) {
			errors['noSpecial'] = true;
		}
		return Object.keys(errors).length > 0 ? errors : null;
	};
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-register-staff',
	imports: [ReactiveFormsModule, Button, InputText, Password, Select, Toast, DatePicker],
	templateUrl: './register-staff.page.html',
	styleUrl: './register-staff.page.css',
})
export class RegisterStaffPage implements OnInit {
	private readonly _formBuilder = inject(NonNullableFormBuilder);
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _messageService = inject(MessageService);
	private readonly _registerStaffApi = inject(RegisterStaffApi);

	protected readonly isSubmitting = signal(false);
	protected readonly genderOptions = GENDER_OPTIONS;

	protected readonly form = this._formBuilder.group({
		token: [''],
		firstName: ['', Validators.required.bind(Validators)],
		lastName: ['', Validators.required.bind(Validators)],
		dateOfBirth: [null as Date | null, Validators.required.bind(Validators)],
		gender: ['', Validators.required.bind(Validators)],
		phoneNumber: ['', Validators.required.bind(Validators)],
		username: ['', [
			Validators.required.bind(Validators),
			Validators.minLength(3),
			Validators.maxLength(20),
			Validators.pattern(/^[a-zA-Z0-9_]+$/),
		], this._usernameAsyncValidator()],
		password: ['', [Validators.required.bind(Validators), strongPasswordValidator()]],
	});

	public ngOnInit(): void {
		const token = this._route.snapshot.queryParamMap.get('invitationToken') ?? '';
		this.form.controls.token.setValue(token);
	}

	protected async onSubmit(): Promise<void> {
		if (this.form.invalid) return;

		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		this.isSubmitting.set(true);

		try {
			const formValue = this.form.getRawValue();

			await firstValueFrom(
				this._registerStaffApi.register(organizationId, {
					token: formValue.token,
					firstName: formValue.firstName,
					lastName: formValue.lastName,
					dateOfBirth: formValue.dateOfBirth
						? `${formValue.dateOfBirth.getFullYear()}-${String(formValue.dateOfBirth.getMonth() + 1).padStart(2, '0')}-${String(formValue.dateOfBirth.getDate()).padStart(2, '0')}`
						: '',
					gender: formValue.gender,
					phoneNumber: formValue.phoneNumber,
					username: formValue.username,
					password: formValue.password,
				}),
			);

			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Account created successfully. Please log in.',
			});

			setTimeout(() => {
				void this._router.navigate(['/auth/login']);
			}, 1500);
		} catch (error: unknown) {
			let message = 'Registration failed';
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
			this.isSubmitting.set(false);
		}
	}

	private _usernameAsyncValidator(): AsyncValidatorFn {
		return (control: AbstractControl) => {
			const organizationId = this._tenantStore.organizationId();
			if (!organizationId || !control.value) {
				return Promise.resolve(null);
			}

			const value = control.value as string;

			return new Promise<ValidationErrors | null>((resolve) => {
				setTimeout(() => {
					void firstValueFrom(
						this._registerStaffApi.validateUsername(organizationId, value),
					)
						.then((isValid) => {
							resolve(isValid ? null : { usernameTaken: true });
						})
						.catch(() => {
							resolve(null);
						});
				}, 500);
			});
		};
	}
}
