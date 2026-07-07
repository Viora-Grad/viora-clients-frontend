import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment.service';
import { GetAppointmentsRequest } from '../../dtos/appointment.dto';

const STATUS_SEVERITY: Record<string, 'success' | 'warn' | 'danger' | 'secondary' | 'info'> = {
	'completed': 'success',
	'InProgress': 'info',
	'confirmed': 'warn',
	'NotArrived': 'secondary',
	'cancelled': 'danger',
	'no-show': 'danger',
};

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-shift-detail',
	imports: [Tag],
	styleUrl: './shift-detail.page.css',
	templateUrl: './shift-detail.page.html',
})
export class ShiftDetailPage implements OnInit, OnDestroy {
	private readonly _route = inject(ActivatedRoute);
	private readonly _location = inject(Location);
	private readonly _router = inject(Router);
	private readonly _branchStore = inject(BranchStore);
	protected readonly appointmentService = inject(AppointmentService);

	protected readonly staffId = signal('');
	protected readonly staffName = signal('');
	protected readonly shiftStart = signal('');
	protected readonly shiftEnd = signal('');

	protected readonly currentAppointment = signal<Appointment | null>(null);
	protected readonly upcomingAppointment = signal<Appointment | null>(null);
	protected readonly isFullscreen = signal(false);

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

	private _staffIdParam = '';
	private _fromDate = '';
	private _toDate = '';
	private _pollIntervalId: ReturnType<typeof setInterval> | null = null;

	public ngOnInit(): void {
		const id = this._route.snapshot.paramMap.get('id');
		if (!id) return;

		this._staffIdParam = id;
		this.staffId.set(id);

		const name = this._route.snapshot.queryParamMap.get('name');
		if (name) this.staffName.set(name);

		const start = this._route.snapshot.queryParamMap.get('start');
		const end = this._route.snapshot.queryParamMap.get('end');

		if (start) {
			this.shiftStart.set(start);
			this._fromDate = this._buildIsoDate(start);
		}
		if (end) {
			this.shiftEnd.set(end);
			this._toDate = this._buildIsoDate(end);
		}

		void this._loadAppointments(1).then(() => {
			this._pollIntervalId = setInterval(() => {
				void this._loadAppointments(this.appointmentService.currentPage());
			}, 2000);
		});
	}

	public ngOnDestroy(): void {
		if (this._pollIntervalId !== null) {
			clearInterval(this._pollIntervalId);
			this._pollIntervalId = null;
		}
	}

	protected goBack(): void {
		this._location.back();
	}

	protected navigateToAppointment(appointmentId: string): void {
		void this._router.navigate(['/branch-management/appointments', appointmentId]);
	}

	protected async toggleFullscreen(): Promise<void> {
		if (!this.isFullscreen()) {
			try {
				await document.documentElement.requestFullscreen();
				this.isFullscreen.set(true);
			} catch {
				this.isFullscreen.set(true);
			}
		} else {
			try {
				await document.exitFullscreen();
			} catch {
				// ignore
			}
			this.isFullscreen.set(false);
		}
	}

	protected getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
		return STATUS_SEVERITY[status] ?? 'secondary';
	}

	protected getStatusLabel(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
	}

	protected getTimeRange(startTime: string, durationMinutes: number): string {
		const start = new Date(startTime);
		const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
		return `${this._formatDate(start)} - ${this._formatDate(end)}`;
	}

	protected async onPageChange(page: number): Promise<void> {
		await this._loadAppointments(page);
	}

	private async _loadAppointments(page: number): Promise<void> {
		const branchId = this._branchStore.currentBranchId();
		if (!branchId || !this._staffIdParam) return;

		const request: GetAppointmentsRequest = {
			branchId,
			staffId: this._staffIdParam,
			page,
			pageSize: 10,
		};

		if (this._fromDate) request.fromDate = this._fromDate;
		if (this._toDate) request.toDate = this._toDate;

		await this.appointmentService.loadAppointments(request);
		this._deriveCurrentAndUpcoming();
	}

	private _deriveCurrentAndUpcoming(): void {
		const appointments = this.appointmentService.appointments();

		const sortedScheduled = [...appointments]
			.filter((a) => a.status === 'NotArrived')
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

		const inProgress = appointments.find((a) => a.status === 'InProgress');

		if (inProgress) {
			this.currentAppointment.set(inProgress);
			const nextScheduled = sortedScheduled.find(
				(a) => new Date(a.startTime).getTime() > new Date(inProgress.startTime).getTime(),
			);
			this.upcomingAppointment.set(nextScheduled ?? null);
			return;
		}

		if (sortedScheduled.length > 0) {
			this.currentAppointment.set(sortedScheduled[0]);
			this.upcomingAppointment.set(sortedScheduled[1] ?? null);
			return;
		}

		this.currentAppointment.set(null);
		this.upcomingAppointment.set(null);
	}

	private _buildIsoDate(timeStr: string): string {
		const today = new Date();
		const parts = timeStr.split(':');
		const hours = Number(parts[0]);
		const minutes = Number(parts[1]);
		const seconds = Number(parts[2] ?? 0);
		today.setUTCHours(hours, minutes, seconds, 0);
		return today.toISOString();
	}

	private _formatDate(date: Date): string {
		const hours = date.getUTCHours();
		const minutes = date.getUTCMinutes();
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
		return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
	}
}
