import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	OnInit,
	signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { ScheduleService } from '../../../schedule/services/schedule.service';
import { ServicesService } from '../../../services/services/services.service';
import { GetAppointmentsRequest } from '../../dtos/appointment.dto';
import { TodayShift } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_SEVERITY: Record<string, 'success' | 'warn' | 'danger' | 'secondary' | 'info'> = {
	completed: 'success',
	InProgress: 'info',
	confirmed: 'warn',
	NotArrived: 'secondary',
	cancelled: 'danger',
	'no-show': 'danger',
};

const APPOINTMENT_STATUSES = [
	{ label: 'All Statuses', value: '' },
	{ label: 'Not Arrived', value: 'NotArrived' },
	{ label: 'In Progress', value: 'InProgress' },
	{ label: 'Completed', value: 'Completed' },
	{ label: 'Canceled', value: 'Canceled' },
	{ label: 'No Show', value: 'NoShow' },
];

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-appointments',
	imports: [Button, Tag, Select, DatePicker, FormsModule],
	styleUrl: './appointments.page.css',
	templateUrl: './appointments.page.html',
})
export class AppointmentsPage implements OnInit {
	protected readonly scheduleService = inject(ScheduleService);
	protected readonly appointmentService = inject(AppointmentService);
	protected readonly servicesService = inject(ServicesService);
	private readonly _branchStore = inject(BranchStore);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _router = inject(Router);

	protected readonly selectedServiceId = signal<string | null>(null);
	protected readonly selectedStaffId = signal<string | null>(null);
	protected readonly selectedStatus = signal<string>('');
	protected readonly fromDate = signal<Date | null>(null);
	protected readonly toDate = signal<Date | null>(null);

	protected readonly statusOptions = APPOINTMENT_STATUSES;

	protected readonly serviceOptions = computed(() => {
		const services = this.servicesService.services();
		return [
			{ label: 'All Services', value: '' },
			...services.map((s) => ({ label: s.name, value: s.id })),
		];
	});

	protected readonly staffOptions = computed(() => {
		const staff = this.scheduleService.staff();
		return [
			{ label: 'All Staff', value: '' },
			...staff.map((s) => ({ label: `${s.firstName} ${s.lastName}`, value: s.id })),
		];
	});

	protected readonly todayShifts = computed<TodayShift[]>(() => {
		const todayName = DAYS_OF_WEEK[new Date().getUTCDay()];
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
				staffId: shift.staffId,
				staffName,
				staffInitials: initials,
				serviceName: '',
				startTime: this._formatTime(shift.startTime),
				endTime: this._formatTime(shift.endTime),
				rawStartTime: shift.startTime,
				rawEndTime: shift.endTime,
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
		const organizationId = this._tenantStore.organizationId();
		if (branchId) {
			void this.scheduleService.loadSchedules(branchId);
			void this.servicesService.loadServices(branchId);
			void this.onPageChange(1);
		}
		if (organizationId) {
			void this.scheduleService.loadStaff(organizationId);
		}
	}

	protected getStatusSeverity(
		status: string,
	): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
		return STATUS_SEVERITY[status] ?? 'secondary';
	}

	protected getStatusLabel(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
	}

	protected navigateToAppointment(appointmentId: string): void {
		void this._router.navigate(['/branch-management/appointments', appointmentId]);
	}

	protected onShiftClick(shift: TodayShift): void {
		void this._router.navigate(['/branch-management/appointments/shift', shift.staffId], {
			queryParams: {
				start: shift.rawStartTime,
				end: shift.rawEndTime,
				name: shift.staffName,
			},
		});
	}

	protected async onPageChange(page: number): Promise<void> {
		const branchId = this._branchStore.currentBranchId();
		if (!branchId) return;

		const request: GetAppointmentsRequest = {
			branchId,
			page,
			pageSize: 10,
		};

		const serviceId = this.selectedServiceId();
		if (serviceId) request.serviceId = serviceId;

		const staffId = this.selectedStaffId();
		if (staffId) request.staffId = staffId;

		const status = this.selectedStatus();
		if (status) request.status = status;

		const from = this.fromDate();
		if (from) request.fromDate = from.toISOString();

		const to = this.toDate();
		if (to) request.toDate = to.toISOString();

		await this.appointmentService.loadAppointments(request);
	}

	protected onFilterChange(): void {
		void this.onPageChange(1);
	}

	protected clearFilters(): void {
		this.selectedServiceId.set(null);
		this.selectedStaffId.set(null);
		this.selectedStatus.set('');
		this.fromDate.set(null);
		this.toDate.set(null);
		void this.onPageChange(1);
	}

	protected getTimeRange(startTime: string, durationMinutes: number): string {
		const start = new Date(startTime);
		const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
		return `${this._formatDate(start)} - ${this._formatDate(end)}`;
	}

	private _formatDate(date: Date): string {
		const hours = date.getUTCHours();
		const minutes = date.getUTCMinutes();
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
		return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
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
