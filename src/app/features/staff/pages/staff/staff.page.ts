import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { StaffStore } from '../../../../core/staff/stores/staff.store';

/* eslint-disable @typescript-eslint/naming-convention */
const STATUS_MAP: Record<string, { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' }> = {
	Active: { label: 'Active', severity: 'success' },
	Pending: { label: 'Pending', severity: 'warn' },
	Suspended: { label: 'Suspended', severity: 'danger' },
};
/* eslint-enable @typescript-eslint/naming-convention */

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-staff',
	imports: [TableModule, Tag, Button, DatePipe, RouterLink],
	templateUrl: './staff.page.html',
	styleUrl: './staff.page.css',
})
export class StaffPage implements OnInit {
	protected readonly staffStore = inject(StaffStore);
	private readonly _tenantStore = inject(TenantStore);

	protected readonly firstItemIndex = computed(() => {
		const totalCount = this.staffStore.totalCount();
		const pageSize = this.staffStore.pageSize();
		const currentPage = this.staffStore.currentPage();
		if (totalCount === 0) return 0;
		return (currentPage - 1) * pageSize + 1;
	});

	protected readonly lastItemIndex = computed(() => {
		const totalCount = this.staffStore.totalCount();
		const pageSize = this.staffStore.pageSize();
		const currentPage = this.staffStore.currentPage();
		return Math.min(currentPage * pageSize, totalCount);
	});

	protected readonly visiblePages = computed(() => {
		const currentPage = this.staffStore.currentPage();
		const totalPages = this.staffStore.totalPages();
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

		void this.staffStore.loadStaffPaginated(organizationId, page, 10);
	}

	protected getStatusInfo(status: string): { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' } {
		return STATUS_MAP[status] ?? { label: status, severity: 'secondary' };
	}
}
