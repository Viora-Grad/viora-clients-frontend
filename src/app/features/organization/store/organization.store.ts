import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { SafeUrl } from '@angular/platform-browser';
import { Organization } from '../apis/dtos/organization.dto';

interface OrganizationState {
	organization: Organization | null;
	logoUrl: SafeUrl | string | null;

	servicesProvided: string[];
	isLoading: boolean;
	isSaving: boolean;
	isUploadingLogo: boolean;
	isUploadingFiles: boolean;
	isCheckingSubDomain: boolean;
	subDomainAvailable: boolean | null;
	error: string | null;
	saveSuccess: boolean;
}

const initialState: OrganizationState = {
	organization: null,
	logoUrl: null,
	servicesProvided: [],
	isLoading: false,
	isSaving: false,
	isUploadingLogo: false,
	isUploadingFiles: false,
	isCheckingSubDomain: false,
	subDomainAvailable: null,
	error: null,
	saveSuccess: false,
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const OrganizationStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),

	withMethods((store) => ({
		setLoading(): void {
			patchState(store, { isLoading: true, error: null });
		},
		setOrganization(organization: Organization): void {
			patchState(store, { organization, isLoading: false });
		},
		setLogoUrl(url: SafeUrl | string | null): void {
			patchState(store, { logoUrl: url, isUploadingLogo: false });
		},
		setUploadingLogo(isUploadingLogo: boolean): void {
			patchState(store, { isUploadingLogo });
		},
		setUploadingFiles(isUploadingFiles: boolean): void {
			patchState(store, { isUploadingFiles });
		},
		setServices(servicesProvided: string[]): void {
			patchState(store, { servicesProvided });
		},
		setSaving(isSaving: boolean): void {
			patchState(store, { isSaving, saveSuccess: false });
		},
		setSaveSuccess(): void {
			patchState(store, { isSaving: false, saveSuccess: true });
		},
		setCheckingSubDomain(isCheckingSubDomain: boolean): void {
			patchState(store, { isCheckingSubDomain, subDomainAvailable: null });
		},
		setSubDomainAvailable(available: boolean): void {
			patchState(store, { subDomainAvailable: available, isCheckingSubDomain: false });
		},
		setError(error: string): void {
			patchState(store, { error, isLoading: false, isSaving: false, isUploadingLogo: false, isUploadingFiles: false });
		},
		clearError(): void {
			patchState(store, { error: null });
		},
		reset(): void {
			patchState(store, initialState);
		},
	})),
);