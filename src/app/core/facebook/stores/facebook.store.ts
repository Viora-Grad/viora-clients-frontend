import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { FacebookPage, FacebookService } from '../services/facebook.service';

interface FacebookState {
	pages: FacebookPage[];
	selectedPageId: string | null;
	userToken: string | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: FacebookState = {
	pages: [],
	selectedPageId: null,
	userToken: null,
	isLoading: false,
	error: null,
};

export const FacebookStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withComputed(({ pages, selectedPageId }) => ({
		selectedPage: computed(() => pages().find((p) => p.id === selectedPageId()) ?? null),
	})),
	withMethods((store) => {
		const facebookService = inject(FacebookService);
		return {
			async initAndLogin(): Promise<void> {
				patchState(store, { isLoading: true, error: null });
				try {
					await facebookService.initSdk();
					const userToken = await facebookService.login();
					patchState(store, { userToken });
					const pages = await facebookService.getPages(userToken);
					patchState(store, { pages, isLoading: false });
				} catch (error: unknown) {
					const message = error instanceof Error ? error.message : 'Facebook login failed';
					patchState(store, { error: message, isLoading: false });
				}
			},
			selectPage(pageId: string): void {
				patchState(store, { selectedPageId: pageId });
			},
			async connectSelectedPage(): Promise<boolean> {
				const { selectedPageId, userToken } = store;
				if (!selectedPageId() || !userToken()) {
					patchState(store, { error: 'No page selected or user token missing' });
					return false;
				}

				patchState(store, { isLoading: true, error: null });
				try {
					console.log(`Successfully connected page with ID: ${selectedPageId()}`);
					console.log(`User token used for connection: ${userToken()}`);
					await facebookService.connectPage(selectedPageId()!, userToken()!);
					patchState(store, { isLoading: false });
					return true;
				} catch (error: unknown) {
					const message = error instanceof Error ? error.message : 'Failed to connect page';
					patchState(store, { error: message, isLoading: false });
					return false;
				}
			},
			reset(): void {
				patchState(store, initialState);
			},
		};
	}),
);
