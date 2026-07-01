import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../apis/auth.api';
import { AuthStore } from '../stores/auth.store';
import { TenantStore } from '../../tenant/stores/tenant.store';

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
			const response = await firstValueFrom(this._authApi.login(organizationId, { username, password }));
			this._authStore.setAuthDetails(
				{ id: response.userId, username, isStaff: true, permissions: response.permissions },
				response.accessToken,
				response.refreshToken,
				rememberMe,
			);
			return true;
		} catch {
			this._authStore.setError('Invalid username or password. Please try again.');
			return false;
		}
	}

	public logout(): void {
		this._authStore.logout();
	}
}
