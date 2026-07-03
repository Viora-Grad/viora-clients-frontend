import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
	ApplicationConfig,
	inject,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { definePreset, palette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { AuthApi } from './core/auth/apis/auth.api';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { AuthStore } from './core/auth/stores/auth.store';
import { AuthService } from './core/auth/services/auth.service';
import { BranchStore } from './core/branch/stores/branch.store';
import { TenantService } from './core/tenant/services/tenant.service';
import { TenantStore } from './core/tenant/stores/tenant.store';

const VIORA_PRESET = definePreset(Aura, {
	semantic: {
		primary: palette('#201335'),
	},
});

async function initializeApp(): Promise<void> {
	const tenantService = inject(TenantService);
	const tenantStore = inject(TenantStore);
	const authService = inject(AuthService);
	const authStore = inject(AuthStore);
	const authApi = inject(AuthApi);
	const branchStore = inject(BranchStore);
	const subdomain = tenantService.getSubdomain();

	if (subdomain) {
		await tenantStore.loadOrganization(subdomain);
	}

	await authService.refresh();

	const isStaff = authStore.isStaff();
	if (isStaff === true) {
		const response = await firstValueFrom(authApi.getStaffMe());
		branchStore.loadBranchesFromStaff(response.branches);
	} else if (isStaff === false && tenantStore.organizationId()) {
		await branchStore.loadBranches(tenantStore.organizationId()!);
	}
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(routes),
		providePrimeNG({
			theme: {
				preset: VIORA_PRESET,
				options: {
					darkModeSelector: false,
				},
			},
		}),
		MessageService,
		provideHttpClient(withInterceptors([authInterceptor])),
		provideAppInitializer(initializeApp),
	],
};
