import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { ScheduleService } from '../../services/schedule.service';
import { Schedule } from '../../models/schedule.model';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-schedule',
	imports: [
		Button,
		Dialog,
		Select,
		DatePicker,
		Textarea,
		FormsModule,
		Toast,
	],
	providers: [MessageService],
	templateUrl: './schedule.page.html',
	styleUrl: './schedule.page.css',
})
export class SchedulePage implements OnInit {
	protected readonly scheduleService = inject(ScheduleService);
	private readonly _branchStore = inject(BranchStore);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _messageService = inject(MessageService);

	protected readonly daysOfWeek = DAYS_OF_WEEK;

	protected readonly scheduledDays = computed(() =>
		DAYS_OF_WEEK.filter((day) => this.scheduleService.schedules().some((s) => s.day === day)),
	);

	protected readonly addScheduleDialogVisible = signal(false);
	protected readonly addShiftDialogVisible = signal(false);
	protected readonly cancelShiftDialogVisible = signal(false);
	protected readonly deleteShiftDialogVisible = signal(false);

	protected readonly selectedDay = signal<string | null>(null);
	protected readonly selectedShiftDay = signal<string | null>(null);

	protected readonly shiftStaffId = signal<string | null>(null);
	protected readonly shiftStartTime = signal<Date | null>(null);
	protected readonly shiftEndTime = signal<Date | null>(null);

	protected readonly cancelDate = signal<Date | null>(null);
	protected readonly cancelReason = signal('');
	protected readonly cancelShiftId = signal<string | null>(null);
	protected readonly cancelShiftStaffId = signal<string | null>(null);
	protected readonly cancelShiftDay = signal<string | null>(null);

	protected readonly cancelDisabledDays = computed(() => {
		const day = this.cancelShiftDay();
		if (!day) return [];
		const dayIndex = DAYS_OF_WEEK.indexOf(day);
		if (dayIndex === -1) return [];
		const targetDayOfWeek = (dayIndex + 1) % 7;
		return [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== targetDayOfWeek);
	});

	protected readonly cancelMinDate = new Date();

	protected readonly deleteShiftId = signal<string | null>(null);
	protected readonly deleteShiftDay = signal<string | null>(null);
	protected readonly deleteShiftStaffId = signal<string | null>(null);

	protected readonly isSubmitting = signal(false);

	protected readonly dayOptions = signal<{ label: string; value: string }[]>([]);

	protected readonly staffOptions = signal<{ label: string; value: string }[]>([]);

	protected readonly branchId = this._branchStore.currentBranchId;

	public ngOnInit(): void {
		const branchId = this._branchStore.currentBranchId();
		if (branchId) {
			void this.scheduleService.loadSchedules(branchId);
		}
		const organizationId = this._tenantStore.organizationId();
		if (organizationId) {
			void this.scheduleService.loadStaff(organizationId);
		}
	}

	protected getScheduleForDay(day: string): Schedule | undefined {
		return this.scheduleService.schedules().find((s) => s.day === day);
	}

	protected getStaffName(staffId: string): string {
		return this.scheduleService.getStaffName(staffId);
	}

	protected formatTime(time: string): string {
		const parts = time.split(':');
		const hours = Number(parts[0]);
		const minutes = parts[1];
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
		return `${displayHours}:${minutes} ${period}`;
	}

	protected openAddScheduleDialog(): void {
		const scheduledDays = this.scheduleService.schedules().map((s) => s.day);
		const available = DAYS_OF_WEEK.filter((d) => !scheduledDays.includes(d));
		this.dayOptions.set(available.map((d) => ({ label: d, value: d })));
		this.selectedDay.set(null);
		this.addScheduleDialogVisible.set(true);
	}

	protected openAddShiftDialog(day: string): void {
		this.selectedShiftDay.set(day);
		this.shiftStaffId.set(null);
		this.shiftStartTime.set(this._snapToTenMinutes(new Date()));
		this.shiftEndTime.set(this._snapToTenMinutes(new Date(Date.now() + 60 * 60 * 1000)));

		const staffList = this.scheduleService.staff();
		this.staffOptions.set(
			staffList.map((s) => ({
				label: `${s.firstName} ${s.lastName}`.trim(),
				value: s.id,
			})),
		);
		this.addShiftDialogVisible.set(true);
	}

	protected openCancelShiftDialog(shiftId: string, staffId: string, day: string): void {
		this.cancelShiftId.set(shiftId);
		this.cancelShiftStaffId.set(staffId);
		this.cancelShiftDay.set(day);
		this.cancelDate.set(null);
		this.cancelReason.set('');
		this.cancelShiftDialogVisible.set(true);
	}

	protected openDeleteShiftDialog(shiftId: string, day: string, staffId: string): void {
		this.deleteShiftId.set(shiftId);
		this.deleteShiftDay.set(day);
		this.deleteShiftStaffId.set(staffId);
		this.deleteShiftDialogVisible.set(true);
	}

	protected async onSubmitSchedule(): Promise<void> {
		const day = this.selectedDay();
		const branchId = this._branchStore.currentBranchId();
		if (!day || !branchId) return;

		this.isSubmitting.set(true);
		const success = await this.scheduleService.createSchedule({ branchId, dayOfWeek: day });
		this.isSubmitting.set(false);

		if (success) {
			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: `${day} schedule created`,
			});
			this.addScheduleDialogVisible.set(false);
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to create schedule',
			});
		}
	}

	protected async onSubmitShift(): Promise<void> {
		const staffId = this.shiftStaffId();
		const day = this.selectedShiftDay();
		const startTime = this.shiftStartTime();
		const endTime = this.shiftEndTime();
		const branchId = this._branchStore.currentBranchId();
		if (!staffId || !day || !startTime || !endTime || !branchId) return;

		const startStr = this._formatTimeForApi(startTime);
		const endStr = this._formatTimeForApi(endTime);

		this.isSubmitting.set(true);
		const success = await this.scheduleService.createShift({
			branchId,
			staffId,
			dayOfWeek: day,
			startTime: startStr,
			endTime: endStr,
		});
		this.isSubmitting.set(false);

		if (success) {
			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Shift created',
			});
			this.addShiftDialogVisible.set(false);
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to create shift',
			});
		}
	}

	protected async onSubmitCancelShift(): Promise<void> {
		const shiftId = this.cancelShiftId();
		const date = this.cancelDate();
		const reason = this.cancelReason();
		const branchId = this._branchStore.currentBranchId();
		if (!shiftId || !date || !branchId) return;

		const dateStr = this._formatDateForApi(date);

		this.isSubmitting.set(true);
		const success = await this.scheduleService.cancelShift(
			{ shiftId, branchId, cancellationDate: dateStr, reason },
			branchId,
		);
		this.isSubmitting.set(false);

		if (success) {
			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Shift cancelled for this date',
			});
			this.cancelShiftDialogVisible.set(false);
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to cancel shift',
			});
		}
	}

	protected async onConfirmDeleteShift(): Promise<void> {
		const shiftId = this.deleteShiftId();
		const branchId = this._branchStore.currentBranchId();
		if (!shiftId || !branchId) return;

		this.isSubmitting.set(true);
		const success = await this.scheduleService.deleteShift(shiftId, branchId);
		this.isSubmitting.set(false);

		if (success) {
			this._messageService.add({
				severity: 'success',
				summary: 'Deleted',
				detail: 'Shift permanently deleted',
			});
			this.deleteShiftDialogVisible.set(false);
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to delete shift',
			});
		}
	}

	private _formatTimeForApi(date: Date): string {
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');
		return `${hours}:${minutes}:${seconds}`;
	}

	private _formatDateForApi(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
	}

	private _snapToTenMinutes(date: Date): Date {
		const snapped = new Date(date);
		const minutes = snapped.getMinutes();
		const remainder = minutes % 10;
		if (remainder > 0) {
			snapped.setMinutes(minutes + (10 - remainder), 0, 0);
		} else {
			snapped.setSeconds(0, 0);
		}
		return snapped;
	}
}
