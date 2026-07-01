import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/stores/auth.store';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-dashboard',
	template: `
		<div class="flex min-h-screen items-center justify-center bg-gray-50">
			<div class="text-center">
				<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
				<p class="mt-2 text-gray-500">Welcome! You are logged in.</p>
				<p class="mt-1 text-sm text-gray-400">User ID: {{ authStore.currentUser()?.id }}</p>
				<button
					type="button"
					(click)="onLogout()"
					class="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
				>
					Logout
				</button>
			</div>
		</div>
	`,
})
export class DashboardComponent {
	protected readonly authStore = inject(AuthStore);
	private readonly _authService = inject(AuthService);

	protected onLogout(): void {
		this._authService.logout();
	}
}
