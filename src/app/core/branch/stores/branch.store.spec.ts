import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { BranchStore } from './branch.store';
import { BranchApi } from '../apis/branch.api';
import { BranchApiResponse, BranchListResponse } from '../dtos/branch.dto';
import { StaffBranch } from '../../auth/dtos/me.dto';

const BRANCH_STORAGE_KEY = 'viora_current_branch_id';

function createApiBranch(overrides: Partial<BranchApiResponse> = {}): BranchApiResponse {
	return {
		branchId: 'b1',
		organizationId: 'org-1',
		organizationName: 'Test Org',
		isOpen: true,
		openedSince: '2024-01-01',
		rating: '4.5',
		status: 1,
		address: '123 Main St',
		coverImage: null,
		timeLineId: 'tl-1',
		coordinates: { longitude: '0', latitude: '0' },
		...overrides,
	};
}

function createListResponse(items: BranchApiResponse[]): BranchListResponse {
	return {
		items,
		page: '1',
		pageSize: '10',
		totalCount: String(items.length),
		count: String(items.length),
		totalPages: '1',
		hasNextPage: false,
		hasPreviousPage: false,
		nextPage: null,
		previousPage: null,
	};
}

function createStaffBranch(overrides: Partial<StaffBranch> = {}): StaffBranch {
	return {
		id: 'sb1',
		organizationId: 'org-1',
		status: 'active',
		address: {
			number: '100',
			street: 'Oak Ave',
			city: 'Springfield',
			state: 'IL',
			countryId: 'US',
			postalCode: '62701',
		},
		contactEmail: 'sb@test.com',
		timeZone: 'America/Chicago',
		latitude: '39.78',
		longitude: '-89.65',
		openedAtUtc: '2024-01-01',
		servicesProvided: [],
		phoneNumbers: [],
		businessHours: [],
		...overrides,
	};
}

describe('BranchStore', () => {
	let store: InstanceType<typeof BranchStore>;

	const mockBranchApi = {
		getBranches: vi.fn(),
	};

	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();

		TestBed.configureTestingModule({
			providers: [{ provide: BranchApi, useValue: mockBranchApi }],
		});

		store = TestBed.inject(BranchStore);
		vi.clearAllMocks();
	});

	afterEach(() => {
		localStorage.clear();
		sessionStorage.clear();
	});

	describe('initial state', () => {
		it('should have empty branches and no selection', () => {
			expect(store.branches()).toEqual([]);
			expect(store.currentBranchId()).toBeNull();
			expect(store.currentBranch()).toBeNull();
			expect(store.isOrganizationLevel()).toBeTruthy();
			expect(store.isLoading()).toBeFalsy();
		});
	});

	describe('loadBranches', () => {
		it('should load branches and restore persisted selection', async () => {
			const apiBranches = [
				createApiBranch({ branchId: 'b1' }),
				createApiBranch({ branchId: 'b2' }),
			];
			mockBranchApi.getBranches.mockReturnValue(of(createListResponse(apiBranches)));

			await store.loadBranches('org-1');

			expect(store.branches().length).toBe(2);
			expect(store.isLoading()).toBeFalsy();
		});

		it('should set error on failure', async () => {
			mockBranchApi.getBranches.mockReturnValue(throwError(() => new Error('fail')));

			await store.loadBranches('org-1');

			expect(store.error()).toBe('Failed to load branches');
			expect(store.isLoading()).toBeFalsy();
		});
	});

	describe('loadBranchesFromStaff', () => {
		it('should load branches from staff data and select first when no stored ID', () => {
			const staffBranches = [
				createStaffBranch({ id: 'sb1' }),
				createStaffBranch({ id: 'sb2' }),
			];

			store.loadBranchesFromStaff(staffBranches);

			expect(store.branches().length).toBe(2);
			expect(store.currentBranchId()).toBe('sb1');
		});

		it('should restore stored branch ID when valid', () => {
			localStorage.setItem(BRANCH_STORAGE_KEY, 'sb2');
			const staffBranches = [
				createStaffBranch({ id: 'sb1' }),
				createStaffBranch({ id: 'sb2' }),
			];

			store.loadBranchesFromStaff(staffBranches);

			expect(store.currentBranchId()).toBe('sb2');
		});

		it('should fall back to first branch when stored ID is stale', () => {
			localStorage.setItem(BRANCH_STORAGE_KEY, 'stale-id');
			const staffBranches = [createStaffBranch({ id: 'sb1' })];

			store.loadBranchesFromStaff(staffBranches);

			expect(store.currentBranchId()).toBe('sb1');
			expect(localStorage.getItem(BRANCH_STORAGE_KEY)).toBe('sb1');
		});

		it('should handle empty staff branches', () => {
			store.loadBranchesFromStaff([]);

			expect(store.branches()).toEqual([]);
			expect(store.currentBranchId()).toBeNull();
		});
	});

	describe('setCurrentBranch', () => {
		it('should persist branch ID to localStorage', () => {
			store.setCurrentBranch('b1');

			expect(store.currentBranchId()).toBe('b1');
			expect(localStorage.getItem(BRANCH_STORAGE_KEY)).toBe('b1');
		});

		it('should remove from localStorage when null', () => {
			localStorage.setItem(BRANCH_STORAGE_KEY, 'b1');
			store.setCurrentBranch(null);

			expect(store.currentBranchId()).toBeNull();
			expect(localStorage.getItem(BRANCH_STORAGE_KEY)).toBeNull();
		});
	});

	describe('computed properties', () => {
		it('currentBranch should find branch by ID', () => {
			const staffBranches = [createStaffBranch({ id: 'sb1' })];
			store.loadBranchesFromStaff(staffBranches);

			const branch = store.currentBranch();
			expect(branch).toBeDefined();
			expect(branch?.id).toBe('sb1');
		});

		it('currentBranch should return null when no selection', () => {
			expect(store.currentBranch()).toBeNull();
		});

		it('isOrganizationLevel should be true when no branch selected', () => {
			expect(store.isOrganizationLevel()).toBeTruthy();
		});

		it('isOrganizationLevel should be false when branch selected', () => {
			store.setCurrentBranch('b1');
			expect(store.isOrganizationLevel()).toBeFalsy();
		});
	});

	describe('clear', () => {
		it('should reset all state and clear storage', () => {
			store.setCurrentBranch('b1');
			store.clear();

			expect(store.branches()).toEqual([]);
			expect(store.currentBranchId()).toBeNull();
			expect(localStorage.getItem(BRANCH_STORAGE_KEY)).toBeNull();
		});
	});

	describe('branch ID persistence', () => {
		it('should restore valid stored branch ID on loadBranches', async () => {
			localStorage.setItem(BRANCH_STORAGE_KEY, 'b1');
			const apiBranches = [
				createApiBranch({ branchId: 'b1' }),
				createApiBranch({ branchId: 'b2' }),
			];
			mockBranchApi.getBranches.mockReturnValue(of(createListResponse(apiBranches)));

			await store.loadBranches('org-1');

			expect(store.currentBranchId()).toBe('b1');
		});

		it('should remove stale branch ID from storage', async () => {
			localStorage.setItem(BRANCH_STORAGE_KEY, 'stale');
			const apiBranches = [createApiBranch({ branchId: 'b1' })];
			mockBranchApi.getBranches.mockReturnValue(of(createListResponse(apiBranches)));

			await store.loadBranches('org-1');

			expect(store.currentBranchId()).toBeNull();
			expect(localStorage.getItem(BRANCH_STORAGE_KEY)).toBeNull();
		});
	});
});
