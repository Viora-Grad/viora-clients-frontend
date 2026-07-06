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

const BRANCH_STORAGE_KEY = 'viora_current_branch_id';

interface BranchState {
	branches: Branch[];
	currentBranchId: string | null;
	isLoading: boolean;
	error: string | null;
	currentPage: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

const initialState: BranchState = {
	branches: [],
	currentBranchId: null,
	isLoading: false,
	error: null,
	currentPage: 1,
	pageSize: 10,
	totalCount: 0,
	totalPages: 0,
	hasNextPage: false,
	hasPreviousPage: false,
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

		function _persistBranchId(branchId: string | null): void {
			if (branchId) {
				localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
			} else {
				localStorage.removeItem(BRANCH_STORAGE_KEY);
			}
		}

		function _restoreBranchId(branches: Branch[]): string | null {
			const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
			if (stored && branches.some((b) => b.id === stored)) {
				return stored;
			}
			localStorage.removeItem(BRANCH_STORAGE_KEY);
			return null;
		}

		return {
			async loadBranches(organizationId: string): Promise<void> {
				patchState(store, { isLoading: true, error: null });
				try {
					const response = await firstValueFrom(branchApi.getBranches(organizationId));
					const branches = response.items.map(mapApiResponseToBranch);
					const restoredBranchId = _restoreBranchId(branches);
					patchState(store, { branches, currentBranchId: restoredBranchId, isLoading: false });
				} catch {
					patchState(store, { error: 'Failed to load branches', isLoading: false });
				}
			},
			async loadBranchesPaginated(
				organizationId: string,
				page: number,
				pageSize: number,
			): Promise<void> {
				patchState(store, { isLoading: true, error: null });
				try {
					const response = await firstValueFrom(
						branchApi.getBranches(organizationId, page, pageSize),
					);
					const branches = response.items.map(mapApiResponseToBranch);
					patchState(store, {
						branches,
						isLoading: false,
						currentPage: Number(response.page),
						pageSize: Number(response.pageSize),
						totalCount: Number(response.totalCount),
						totalPages: Number(response.totalPages),
						hasNextPage: response.hasNextPage,
						hasPreviousPage: response.hasPreviousPage,
					});
				} catch {
					patchState(store, { error: 'Failed to load branches', isLoading: false });
				}
			},
			loadBranchesFromStaff(staffBranches: StaffBranch[]): void {
				const branches = staffBranches.map(mapStaffBranchToBranch);
				const restoredBranchId = _restoreBranchId(branches);
				const currentBranchId = restoredBranchId ?? (branches.length > 0 ? branches[0].id : null);
				_persistBranchId(currentBranchId);
				patchState(store, { branches, currentBranchId });
			},
			setCurrentBranch(branchId: string | null): void {
				_persistBranchId(branchId);
				patchState(store, { currentBranchId: branchId });
			},
			clear(): void {
				localStorage.removeItem(BRANCH_STORAGE_KEY);
				patchState(store, initialState);
			},
		};
	}),
);
