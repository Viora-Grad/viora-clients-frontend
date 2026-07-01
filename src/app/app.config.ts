import { provideHttpClient } from '@angular/common/http';
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
import { routes } from './app.routes';
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
	const subdomain = tenantService.getSubdomain();

	if (subdomain) {
		await tenantStore.loadOrganization(subdomain);
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
		provideHttpClient(),
		provideAppInitializer(initializeApp),
	],
};
