import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { TenantService } from '../services/tenant.service';

interface TenantState {
	organizationId: string | null;
	slug: string | null;
	loaded: boolean;
	error: string | null;
}

const initialState: TenantState = {
	organizationId: null,
	slug: null,
	loaded: false,
	error: null,
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TenantStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withComputed(({ organizationId, slug }) => ({
		isReady: computed(() => organizationId() !== null && slug() !== null),
	})),
	withMethods((store) => {
		const tenantService = inject(TenantService);

		return {
			async loadOrganization(slug: string): Promise<boolean> {
				patchState(store, { slug, loaded: false, error: null });

				try {
					const response = await firstValueFrom(tenantService.resolveOrganization(slug));
					patchState(store, {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						organizationId: response.id,
						loaded: true,
					});
					return true;
				} catch (error: unknown) {
					const message = error instanceof Error ? error.message : 'Failed to resolve organization';
					patchState(store, { error: message, loaded: true });
					return false;
				}
			},
		};
	}),
);
