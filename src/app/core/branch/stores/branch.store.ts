import { computed, inject } from '@angular/core';
import {
	patchState,
	signalStore,
	withComputed,
	withMethods,
	withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { StaffBranch } from '../../auth/dtos/me.dto';
import { BranchApi } from '../apis/branch.api';
import { mapApiResponseToBranch, mapStaffBranchToBranch } from '../dtos/branch.dto';
import { Branch } from '../models/branch.model';

interface BranchState {
	branches: Branch[];
	currentBranchId: string | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: BranchState = {
	branches: [],
	currentBranchId: null,
	isLoading: false,
	error: null,
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const BranchStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),

	withComputed(({ branches, currentBranchId }) => ({
		currentBranch: computed(() => {
			const id = currentBranchId();
			if (!id) return null;
			return branches().find((b) => b.id === id) ?? null;
		}),
		isOrganizationLevel: computed(() => currentBranchId() === null),
	})),

	withMethods((store) => {
		const branchApi = inject(BranchApi);

		return {
			async loadBranches(organizationId: string): Promise<void> {
				patchState(store, { isLoading: true, error: null });
				try {
					const response = await firstValueFrom(branchApi.getBranches(organizationId));
					const branches = response.items.map(mapApiResponseToBranch);
					patchState(store, { branches, isLoading: false });
				} catch {
					patchState(store, { error: 'Failed to load branches', isLoading: false });
				}
			},
			loadBranchesFromStaff(staffBranches: StaffBranch[]): void {
				const branches = staffBranches.map(mapStaffBranchToBranch);
				const currentBranchId = branches.length > 0 ? branches[0].id : null;
				patchState(store, { branches, currentBranchId });
			},
			setCurrentBranch(branchId: string | null): void {
				patchState(store, { currentBranchId: branchId });
			},
			clear(): void {
				patchState(store, initialState);
			},
		};
	}),
);
