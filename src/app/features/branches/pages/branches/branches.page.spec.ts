import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BranchesPage } from './branches.page';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

describe('BranchesPage', () => {
	let component: BranchesPage;

	const mockBranchStore = {
		currentPage: vi.fn().mockReturnValue(1),
		pageSize: vi.fn().mockReturnValue(10),
		totalCount: vi.fn().mockReturnValue(0),
		totalPages: vi.fn().mockReturnValue(0),
		loadBranchesPaginated: vi.fn().mockResolvedValue(undefined),
	};

	const mockTenantStore = {
		organizationId: vi.fn().mockReturnValue('org-1'),
	};

	const mockRouter = {
		navigate: vi.fn().mockResolvedValue(true),
	};

	const mockActivatedRoute = {
		snapshot: { paramMap: { get: vi.fn().mockReturnValue(null) } },
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				{ provide: BranchStore, useValue: mockBranchStore },
				{ provide: TenantStore, useValue: mockTenantStore },
				{ provide: Router, useValue: mockRouter },
				{ provide: ActivatedRoute, useValue: mockActivatedRoute },
			],
		});
		const fixture = TestBed.createComponent(BranchesPage);
		component = fixture.componentInstance;
		vi.clearAllMocks();
	});

	describe('computed: firstItemIndex', () => {
		it('should return 0 when totalCount is 0', () => {
			mockBranchStore.totalCount.mockReturnValue(0);
			expect((component as any).firstItemIndex()).toBe(0);
		});

		it('should return 1 on first page', () => {
			mockBranchStore.totalCount.mockReturnValue(25);
			mockBranchStore.pageSize.mockReturnValue(10);
			mockBranchStore.currentPage.mockReturnValue(1);
			expect((component as any).firstItemIndex()).toBe(1);
		});

		it('should return correct index for page 3', () => {
			mockBranchStore.totalCount.mockReturnValue(50);
			mockBranchStore.pageSize.mockReturnValue(10);
			mockBranchStore.currentPage.mockReturnValue(3);
			expect((component as any).firstItemIndex()).toBe(21);
		});
	});

	describe('computed: lastItemIndex', () => {
		it('should return min of currentPage * pageSize and totalCount', () => {
			mockBranchStore.totalCount.mockReturnValue(25);
			mockBranchStore.pageSize.mockReturnValue(10);
			mockBranchStore.currentPage.mockReturnValue(3);
			expect((component as any).lastItemIndex()).toBe(25);
		});

		it('should return pageSize for full first page', () => {
			mockBranchStore.totalCount.mockReturnValue(25);
			mockBranchStore.pageSize.mockReturnValue(10);
			mockBranchStore.currentPage.mockReturnValue(1);
			expect((component as any).lastItemIndex()).toBe(10);
		});

		it('should return totalCount when less than pageSize', () => {
			mockBranchStore.totalCount.mockReturnValue(3);
			mockBranchStore.pageSize.mockReturnValue(10);
			mockBranchStore.currentPage.mockReturnValue(1);
			expect((component as any).lastItemIndex()).toBe(3);
		});
	});

	describe('computed: visiblePages', () => {
		it('should show 5 pages around current', () => {
			mockBranchStore.currentPage.mockReturnValue(5);
			mockBranchStore.totalPages.mockReturnValue(10);
			expect((component as any).visiblePages()).toEqual([3, 4, 5, 6, 7]);
		});

		it('should clamp at start', () => {
			mockBranchStore.currentPage.mockReturnValue(1);
			mockBranchStore.totalPages.mockReturnValue(10);
			expect((component as any).visiblePages()).toEqual([1, 2, 3, 4, 5]);
		});

		it('should clamp at end', () => {
			mockBranchStore.currentPage.mockReturnValue(10);
			mockBranchStore.totalPages.mockReturnValue(10);
			expect((component as any).visiblePages()).toEqual([6, 7, 8, 9, 10]);
		});

		it('should handle fewer than 5 pages', () => {
			mockBranchStore.currentPage.mockReturnValue(1);
			mockBranchStore.totalPages.mockReturnValue(3);
			expect((component as any).visiblePages()).toEqual([1, 2, 3]);
		});

		it('should handle single page', () => {
			mockBranchStore.currentPage.mockReturnValue(1);
			mockBranchStore.totalPages.mockReturnValue(1);
			expect((component as any).visiblePages()).toEqual([1]);
		});
	});

	describe('getStatusInfo', () => {
		it('should return Active for status 0', () => {
			expect((component as any).getStatusInfo(0)).toEqual({ label: 'Active', severity: 'success' });
		});

		it('should return Hidden for status 1', () => {
			expect((component as any).getStatusInfo(1)).toEqual({ label: 'Hidden', severity: 'warn' });
		});

		it('should return Disabled for status 2', () => {
			expect((component as any).getStatusInfo(2)).toEqual({ label: 'Disabled', severity: 'danger' });
		});

		it('should return Closed for status 3', () => {
			expect((component as any).getStatusInfo(3)).toEqual({ label: 'Closed', severity: 'secondary' });
		});

		it('should return Unknown for unknown status', () => {
			expect((component as any).getStatusInfo(99)).toEqual({ label: 'Unknown', severity: 'secondary' });
		});
	});

	describe('navigateToBranch', () => {
		it('should navigate to branch detail route', () => {
			const router = { navigate: vi.fn().mockResolvedValue(true) };
			(component as any)._router = router;

			(component as any).navigateToBranch('b1');

			expect(router.navigate).toHaveBeenCalledWith(['/branches', 'b1']);
		});
	});
});
