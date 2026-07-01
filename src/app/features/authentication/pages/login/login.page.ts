import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AuthStore } from '../../../../core/auth/stores/auth.store';
import { Toast } from 'primeng/toast';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Checkbox } from 'primeng/checkbox';
import { Button } from 'primeng/button';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-login',
	imports: [
		ReactiveFormsModule,
		RouterLink,
		Toast,
		IconField,
		InputIcon,
		InputText,
		Password,
		Checkbox,
		Button,
	],
	templateUrl: './login.page.html',
	styleUrl: './login.page.css',
})
export class LoginPage {
	private readonly _formBuilder = inject(NonNullableFormBuilder);
	private readonly _authService = inject(AuthService);
	protected readonly authStore = inject(AuthStore);

	protected readonly form = this._formBuilder.group({
		username: ['', Validators.required.bind(Validators)],
		password: ['', Validators.required.bind(Validators)],
		rememberMe: [false],
	});

	protected async onSubmit(): Promise<void> {
		if (this.form.invalid) return;

		const { username, password, rememberMe } = this.form.getRawValue();
		const success = await this._authService.login(username, password, rememberMe);

		if (!success) {
			this.form.controls.password.reset();
		}
	}
}
