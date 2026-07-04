import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

/* eslint-disable @typescript-eslint/naming-convention */
const STATUS_MAP: Record<number, { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' }> = {
	0: { label: 'Active', severity: 'success' },
	1: { label: 'Hidden', severity: 'warn' },
	2: { label: 'Disabled', severity: 'danger' },
	3: { label: 'Closed', severity: 'secondary' },
};
/* eslint-enable @typescript-eslint/naming-convention */

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-branches',
	imports: [TableModule, Tag, Button, DatePipe, RouterLink],
	templateUrl: './branches.page.html',
	styleUrl: './branches.page.css',
})
export class BranchesPage implements OnInit {
	protected readonly branchStore = inject(BranchStore);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _router = inject(Router);

	protected readonly firstItemIndex = computed(() => {
		const totalCount = this.branchStore.totalCount();
		const pageSize = this.branchStore.pageSize();
		const currentPage = this.branchStore.currentPage();
		if (totalCount === 0) return 0;
		return (currentPage - 1) * pageSize + 1;
	});

	protected readonly lastItemIndex = computed(() => {
		const totalCount = this.branchStore.totalCount();
		const pageSize = this.branchStore.pageSize();
		const currentPage = this.branchStore.currentPage();
		return Math.min(currentPage * pageSize, totalCount);
	});

	protected readonly visiblePages = computed(() => {
		const currentPage = this.branchStore.currentPage();
		const totalPages = this.branchStore.totalPages();
		const maxVisible = 5;

		let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
		const end = Math.min(totalPages, start + maxVisible - 1);

		if (end - start + 1 < maxVisible) {
			start = Math.max(1, end - maxVisible + 1);
		}

		const pages: number[] = [];
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		return pages;
	});

	public ngOnInit(): void {
		this.onPageChange(1);
	}

	protected onPageChange(page: number): void {
		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		void this.branchStore.loadBranchesPaginated(organizationId, page, 10);
	}

	protected getStatusInfo(status: number): { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' } {
		return STATUS_MAP[status] ?? { label: 'Unknown', severity: 'secondary' };
	}

	protected navigateToBranch(branchId: string): void {
		void this._router.navigate(['/branches', branchId]);
	}
}
