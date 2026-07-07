import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ScheduleApi } from '../apis/schedule.api';
import {
	CancelShiftRequest,
	CreateScheduleRequest,
	CreateShiftRequest,
} from '../dtos/schedule.dto';
import { Schedule, StaffOption } from '../models/schedule.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
	private readonly _scheduleApi = inject(ScheduleApi);

	public readonly schedules = signal<Schedule[]>([]);
	public readonly staff = signal<StaffOption[]>([]);
	public readonly isLoading = signal(false);
	public readonly error = signal<string | null>(null);

	public async loadSchedules(branchId: string): Promise<void> {
		this.isLoading.set(true);
		this.error.set(null);
		try {
			const schedules = await firstValueFrom(this._scheduleApi.getSchedules(branchId));
			this.schedules.set(schedules);
		} catch {
			this.error.set('Failed to load schedules');
		} finally {
			this.isLoading.set(false);
		}
	}

	public async loadStaff(organizationId: string): Promise<void> {
		try {
			const staff = await firstValueFrom(this._scheduleApi.getStaff(organizationId));
			this.staff.set(staff);
		} catch {
			// Staff loading is non-critical for display
		}
	}

	public async createSchedule(request: CreateScheduleRequest): Promise<boolean> {
		try {
			await firstValueFrom(this._scheduleApi.createSchedule(request));
			await this.loadSchedules(request.branchId);
			return true;
		} catch {
			return false;
		}
	}

	public async createShift(request: CreateShiftRequest): Promise<boolean> {
		try {
			await firstValueFrom(this._scheduleApi.createShift(request));
			await this.loadSchedules(request.branchId);
			return true;
		} catch {
			return false;
		}
	}

	public async cancelShift(request: CancelShiftRequest, branchId: string): Promise<boolean> {
		try {
			await firstValueFrom(this._scheduleApi.cancelShift(request));
			await this.loadSchedules(branchId);
			return true;
		} catch {
			return false;
		}
	}

	public async deleteShift(shiftId: string, branchId: string): Promise<boolean> {
		try {
			await firstValueFrom(this._scheduleApi.deleteShift(shiftId));
			await this.loadSchedules(branchId);
			return true;
		} catch {
			return false;
		}
	}

	public getStaffName(staffId: string): string {
		const s = this.staff().find((item) => item.id === staffId);
		if (!s) return 'Unknown';
		return `${s.firstName} ${s.lastName}`.trim() || 'Unknown';
	}
}
