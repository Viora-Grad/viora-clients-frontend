import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { TenantStore } from '../stores/tenant.store';

export const tenantGuard: CanActivateFn = (): boolean => {
	const store = inject(TenantStore);

	if (store.error()) {
		// window.location.href = 'https://www.google.com';
		return false;
	}

	return true;
};
