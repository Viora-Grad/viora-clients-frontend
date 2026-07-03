import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-owner-callback',
	imports: [],
	templateUrl: './owner-callback.page.html',
	styleUrl: './owner-callback.page.css',
})
export class OwnerCallbackPage implements OnInit {
	private readonly _route = inject(ActivatedRoute);
	private readonly _router = inject(Router);
	private readonly _authService = inject(AuthService);

	protected readonly error = signal<string | null>(null);
	protected readonly isLoading = signal(true);

	public ngOnInit(): void {
		const refreshToken = this._route.snapshot.queryParamMap.get('refreshToken');

		console.log('OwnerCallbackPage: refreshToken:', refreshToken);

		if (!refreshToken) {
			this.isLoading.set(false);
			this.error.set('No refresh token provided. Please try again.');
			return;
		}

		void this._handleCallback(refreshToken);
	}

	private async _handleCallback(refreshToken: string): Promise<void> {
		const success = await this._authService.refreshFromCallback(refreshToken);

		if (success) {
			await this._router.navigate(['/']);
		} else {
			this.isLoading.set(false);
			this.error.set('Failed to authenticate. Please try again.');
		}
	}
}
