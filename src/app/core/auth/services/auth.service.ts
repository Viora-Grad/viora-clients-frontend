import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { TenantStore } from '../../tenant/stores/tenant.store';
import { AuthApi } from '../apis/auth.api';
import { AuthStore } from '../stores/auth.store';
import { Permission } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly _authApi = inject(AuthApi);
	private readonly _authStore = inject(AuthStore);
	private readonly _tenantStore = inject(TenantStore);

	public async login(username: string, password: string, rememberMe = true): Promise<boolean> {
		this._authStore.setLoading();

		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) {
			this._authStore.setError('Organization not resolved. Please try again.');
			return false;
		}

		try {
			const response = await firstValueFrom(
				this._authApi.login(organizationId, { username, password }),
			);
			this._authStore.setAuthDetails(
				{ id: response.userId, isStaff: true, permissions: response.permissions },
				response.accessToken,
				response.refreshToken,
				rememberMe,
			);
			await this.fetchCurrentUser();
			return true;
		} catch {
			this._authStore.setError('Invalid username or password. Please try again.');
			return false;
		}
	}

	public async refresh(): Promise<boolean> {
		const refreshToken = this._authStore.refreshToken();
		const isStaff = this._authStore.isStaff();

		if (!refreshToken || isStaff === null) {
			return false;
		}

		this._authStore.setLoading();

		try {
			const response = await firstValueFrom(
				isStaff
					? this._authApi.staffRefreshToken(refreshToken)
					: this._authApi.refreshToken(refreshToken),
			);
			this._authStore.setAuthDetails(
				{ id: response.userId, isStaff, permissions: response.permissions },
				response.accessToken,
				response.refreshToken ?? refreshToken,
			);
			await this.fetchCurrentUser();
			return true;
		} catch {
			this._authStore.logout();
			return false;
		}
	}

	public async refreshFromCallback(refreshToken: string): Promise<boolean> {
		this._authStore.setLoading();

		try {
			const response = await firstValueFrom(this._authApi.refreshToken(refreshToken));
			this._authStore.setAuthDetails(
				{ id: response.userId, isStaff: false, permissions: response.permissions },
				response.accessToken,
				response.refreshToken ?? refreshToken,
				true,
			);
			await this.fetchCurrentUser();
			return true;
		} catch {
			this._authStore.setError('Failed to authenticate. Please try again.');
			return false;
		}
	}

	public logout(): void {
		this._authStore.logout();
	}

	public getPermissions(): Observable<Permission[]> {
		return this._authApi.getPermissions();
	}

	public async fetchCurrentUser(): Promise<void> {
		const isStaff = this._authStore.isStaff();
		if (isStaff === null) return;

		try {
			const currentUser = this._authStore.currentUser();
			if (!currentUser) return;

			if (isStaff) {
				const response = await firstValueFrom(this._authApi.getStaffMe());
				this._authStore.setCurrentUser({
					...currentUser,
					firstName: response.firstName,
					lastName: response.lastName,
				});
			} else {
				const response = await firstValueFrom(this._authApi.getMe());
				this._authStore.setCurrentUser({
					...currentUser,
					firstName: response.firstName,
					lastName: response.lastName,
					email: response.email,
					dateOfBirth: response.dateOfBirth,
					gender: response.gender,
				});
			}
		} catch {
			// Silently fail - user details are not critical
		}
	}
}
