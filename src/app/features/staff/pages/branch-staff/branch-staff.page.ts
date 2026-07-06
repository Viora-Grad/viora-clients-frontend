import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { MultiSelect } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { StaffApi } from '../../../../core/staff/apis/staff.api';
import { Staff } from '../../../../core/staff/models/staff.model';
import { StaffDetail, StaffDetailService } from '../../../../core/staff/models/staff-detail.model';
import { Service } from '../../../services/models/services.model';
import { ServicesApi } from '../../../services/apis/services.api';

/* eslint-disable @typescript-eslint/naming-convention */
const STATUS_MAP: Record<string, { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' }> = {
	Active: { label: 'Active', severity: 'success' },
	Pending: { label: 'Pending', severity: 'warn' },
	Suspended: { label: 'Suspended', severity: 'danger' },
};
/* eslint-enable @typescript-eslint/naming-convention */

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-branch-staff',
	imports: [TableModule, Tag, Button, DatePipe, Dialog, MultiSelect, FormsModule, Toast],
	providers: [MessageService],
	templateUrl: './branch-staff.page.html',
	styleUrl: './branch-staff.page.css',
})
export class BranchStaffPage implements OnInit {
	private readonly _branchStore = inject(BranchStore);
	private readonly _staffApi = inject(StaffApi);
	private readonly _servicesApi = inject(ServicesApi);
	private readonly _messageService = inject(MessageService);

	protected readonly staff = signal<Staff[]>([]);
	protected readonly isLoading = signal(false);
	protected readonly currentPage = signal(1);
	protected readonly pageSize = signal(10);
	protected readonly totalCount = signal(0);
	protected readonly totalPages = signal(0);
	protected readonly hasNextPage = signal(false);
	protected readonly hasPreviousPage = signal(false);

	protected readonly isAssignDialogVisible = signal(false);
	protected readonly isSubmitting = signal(false);
	protected readonly selectedStaffId = signal<string | null>(null);
	protected readonly selectedStaffName = signal('');
	protected readonly selectedServiceIds = signal<string[]>([]);
	protected readonly branchServices = signal<Service[]>([]);
	protected readonly staffDetails = signal<Map<string, StaffDetail>>(new Map());

	protected readonly firstItemIndex = computed(() => {
		const tc = this.totalCount();
		const ps = this.pageSize();
		const cp = this.currentPage();
		if (tc === 0) return 0;
		return (cp - 1) * ps + 1;
	});

	protected readonly lastItemIndex = computed(() => {
		const tc = this.totalCount();
		const ps = this.pageSize();
		const cp = this.currentPage();
		return Math.min(cp * ps, tc);
	});

	protected readonly visiblePages = computed(() => {
		const cp = this.currentPage();
		const tp = this.totalPages();
		const maxVisible = 5;

		let start = Math.max(1, cp - Math.floor(maxVisible / 2));
		const end = Math.min(tp, start + maxVisible - 1);

		if (end - start + 1 < maxVisible) {
			start = Math.max(1, end - maxVisible + 1);
		}

		const pages: number[] = [];
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		return pages;
	});

	private get _currentBranchId(): string {
		return this._branchStore.currentBranchId() ?? '';
	}

	public ngOnInit(): void {
		this.onPageChange(1);
	}

	protected onPageChange(page: number): void {
		const branchId = this._currentBranchId;
		if (!branchId) return;

		this.isLoading.set(true);
		void firstValueFrom(this._staffApi.getStaffByBranch(branchId, page, this.pageSize()))
			.then(async (response) => {
				const items = response.items.map((item) => ({
					id: item.id,
					firstName: item.firstName,
					lastName: item.lastName,
					phoneNumber: item.phoneNumber,
					gender: item.gender,
					dateOfBirth: item.dateOfBirth,
					status: item.status,
				}));
				this.staff.set(items);
				this.currentPage.set(Number(response.page));
				this.pageSize.set(Number(response.pageSize));
				this.totalCount.set(Number(response.totalCount));
				this.totalPages.set(Number(response.totalPages));
				this.hasNextPage.set(response.hasNextPage);
				this.hasPreviousPage.set(response.hasPreviousPage);
				await this._loadStaffDetails();
			})
			.finally(() => {
				this.isLoading.set(false);
			});
	}

	private async _loadStaffDetails(): Promise<void> {
		const staffList = this.staff();
		const details = await Promise.all(
			staffList.map((s) => firstValueFrom(this._staffApi.getStaffById(s.id)).catch(() => null)),
		);
		const map = new Map<string, StaffDetail>();
		for (const detail of details) {
			if (detail) {
				map.set(detail.id, detail);
			}
		}
		this.staffDetails.set(map);
	}

	protected getStaffServices(staffId: string): StaffDetailService[] {
		return this.staffDetails().get(staffId)?.services ?? [];
	}

	protected getStatusInfo(status: string): { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' } {
		return STATUS_MAP[status] ?? { label: status, severity: 'secondary' };
	}

	protected async openAssignDialog(staffId: string, staffName: string): Promise<void> {
		this.selectedStaffId.set(staffId);
		this.selectedStaffName.set(staffName);
		this.selectedServiceIds.set([]);
		this.isAssignDialogVisible.set(true);

		const branchId = this._currentBranchId;

		const [detail, services] = await Promise.all([
			firstValueFrom(this._staffApi.getStaffById(staffId)).catch(() => null),
			firstValueFrom(this._servicesApi.getServicesByBranch(branchId)).catch(() => []),
		]);

		this.branchServices.set(services);

		if (detail) {
			this.selectedServiceIds.set(detail.services.map((s) => s.id));
		}
	}

	protected async onSubmitAssign(): Promise<void> {
		const staffId = this.selectedStaffId();
		if (!staffId) return;

		this.isSubmitting.set(true);

		try {
			await firstValueFrom(this._staffApi.updateStaffServices(staffId, { serviceIds: this.selectedServiceIds() }));
			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Services updated successfully',
			});
			this.isAssignDialogVisible.set(false);
			this.onPageChange(this.currentPage());
		} catch {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to update services',
			});
		} finally {
			this.isSubmitting.set(false);
		}
	}
}
