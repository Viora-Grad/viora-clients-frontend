import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { definePreset, palette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';

const VIORA_PRESET = definePreset(Aura, {
	semantic: {
		primary: palette('#201335'),
	},
});

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
	],
};
