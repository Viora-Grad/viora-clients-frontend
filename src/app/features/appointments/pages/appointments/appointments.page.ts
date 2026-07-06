import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { ScheduleService } from '../../../schedule/services/schedule.service';
import { AppointmentService } from '../../services/appointment.service';
import { TodayShift } from '../../models/appointment.model';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_SEVERITY: Record<string, 'success' | 'warn' | 'danger' | 'secondary' | 'info'> = {
	'completed': 'success',
	'in-progress': 'info',
	'confirmed': 'warn',
	'scheduled': 'secondary',
	'cancelled': 'danger',
	'no-show': 'danger',
};

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-appointments',
	imports: [Button, Tag],
	styleUrl: './appointments.page.css',
	templateUrl: './appointments.page.html',
})
export class AppointmentsPage implements OnInit {
	protected readonly scheduleService = inject(ScheduleService);
	protected readonly appointmentService = inject(AppointmentService);
	private readonly _branchStore = inject(BranchStore);

	protected readonly todayShifts = computed<TodayShift[]>(() => {
		const todayName = DAYS_OF_WEEK[new Date().getDay()];
		const todaySchedule = this.scheduleService.schedules().find((s) => s.day === todayName);
		if (!todaySchedule) return [];

		return todaySchedule.shifts.map((shift, index) => {
			const staffName = this.scheduleService.getStaffName(shift.staffId);
			const initials = staffName
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase();

			return {
				id: `${todayName}-${index}`,
				staffName,
				staffInitials: initials,
				serviceName: '',
				startTime: this._formatTime(shift.startTime),
				endTime: this._formatTime(shift.endTime),
			};
		});
	});

	protected readonly firstItemIndex = computed(() => {
		const totalCount = this.appointmentService.totalCount();
		const pageSize = this.appointmentService.pageSize();
		const currentPage = this.appointmentService.currentPage();
		if (totalCount === 0) return 0;
		return (currentPage - 1) * pageSize + 1;
	});

	protected readonly lastItemIndex = computed(() => {
		const totalCount = this.appointmentService.totalCount();
		const pageSize = this.appointmentService.pageSize();
		const currentPage = this.appointmentService.currentPage();
		return Math.min(currentPage * pageSize, totalCount);
	});

	protected readonly visiblePages = computed(() => {
		const currentPage = this.appointmentService.currentPage();
		const totalPages = this.appointmentService.totalPages();
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
		const branchId = this._branchStore.currentBranchId();
		if (branchId) {
			void this.scheduleService.loadSchedules(branchId);
			void this.onPageChange(1);
		}
	}

	protected getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
		return STATUS_SEVERITY[status] ?? 'secondary';
	}

	protected getStatusLabel(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
	}

	protected onShiftClick(_shiftId: string): void {
		// Placeholder for shift click handler
	}

	protected async onPageChange(page: number): Promise<void> {
		const branchId = this._branchStore.currentBranchId();
		if (!branchId) return;

		await this.appointmentService.loadAppointments({
			branchId,
			page,
			pageSize: 10,
		});
	}

	private _formatTime(time: string): string {
		const parts = time.split(':');
		const hours = Number(parts[0]);
		const minutes = parts[1];
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
		return `${displayHours}:${minutes} ${period}`;
	}
}
