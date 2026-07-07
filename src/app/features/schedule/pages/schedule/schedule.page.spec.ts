import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SchedulePage } from './schedule.page';
import { ScheduleService } from '../../services/schedule.service';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

describe('SchedulePage', () => {
	let component: SchedulePage;

	const mockScheduleService = {
		schedules: vi.fn().mockReturnValue([]),
		staff: vi.fn().mockReturnValue([]),
		loadSchedules: vi.fn().mockResolvedValue(undefined),
		loadStaff: vi.fn().mockResolvedValue(undefined),
		getStaffName: vi.fn().mockReturnValue('Unknown'),
	};

	const mockBranchStore = {
		currentBranchId: vi.fn().mockReturnValue('b1'),
	};

	const mockTenantStore = {
		organizationId: vi.fn().mockReturnValue('org-1'),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				{ provide: ScheduleService, useValue: mockScheduleService },
				{ provide: BranchStore, useValue: mockBranchStore },
				{ provide: TenantStore, useValue: mockTenantStore },
			],
		});
		const fixture = TestBed.createComponent(SchedulePage);
		component = fixture.componentInstance;
		vi.clearAllMocks();
	});

	describe('formatTime', () => {
		it('should format morning time', () => {
			expect((component as any).formatTime('09:30')).toBe('9:30 AM');
		});

		it('should format afternoon time', () => {
			expect((component as any).formatTime('14:15')).toBe('2:15 PM');
		});

		it('should format midnight', () => {
			expect((component as any).formatTime('00:00')).toBe('12:00 AM');
		});

		it('should format noon', () => {
			expect((component as any).formatTime('12:00')).toBe('12:00 PM');
		});

		it('should format 12:30 PM', () => {
			expect((component as any).formatTime('12:30')).toBe('12:30 PM');
		});

		it('should format 11:59 PM', () => {
			expect((component as any).formatTime('23:59')).toBe('11:59 PM');
		});

		it('should format 1:00 AM', () => {
			expect((component as any).formatTime('01:00')).toBe('1:00 AM');
		});
	});

	describe('computed: scheduledDays', () => {
		it('should return only days with schedules', () => {
			mockScheduleService.schedules.mockReturnValue([
				{ day: 'Monday', shifts: [] },
				{ day: 'Wednesday', shifts: [] },
			]);

			expect((component as any).scheduledDays()).toEqual(['Monday', 'Wednesday']);
		});

		it('should return empty array when no schedules', () => {
			mockScheduleService.schedules.mockReturnValue([]);
			expect((component as any).scheduledDays()).toEqual([]);
		});

		it('should return all days when all have schedules', () => {
			mockScheduleService.schedules.mockReturnValue([
				{ day: 'Monday', shifts: [] },
				{ day: 'Tuesday', shifts: [] },
				{ day: 'Wednesday', shifts: [] },
				{ day: 'Thursday', shifts: [] },
				{ day: 'Friday', shifts: [] },
				{ day: 'Saturday', shifts: [] },
				{ day: 'Sunday', shifts: [] },
			]);

			expect((component as any).scheduledDays()).toHaveLength(7);
		});
	});

	describe('getScheduleForDay', () => {
		it('should find schedule for given day', () => {
			mockScheduleService.schedules.mockReturnValue([
				{ day: 'Monday', shifts: [{ shiftId: 'sh1', staffId: 's1', startTime: '09:00', endTime: '17:00' }] },
				{ day: 'Tuesday', shifts: [] },
			]);

			const result = (component as any).getScheduleForDay('Monday');
			expect(result.day).toBe('Monday');
			expect(result.shifts.length).toBe(1);
		});

		it('should return undefined for unscheduled day', () => {
			mockScheduleService.schedules.mockReturnValue([
				{ day: 'Monday', shifts: [] },
			]);

			expect((component as any).getScheduleForDay('Friday')).toBeUndefined();
		});
	});

	describe('getStaffName', () => {
		it('should delegate to ScheduleService.getStaffName', () => {
			mockScheduleService.getStaffName.mockReturnValue('Jane Smith');

			expect((component as any).getStaffName('s1')).toBe('Jane Smith');
			expect(mockScheduleService.getStaffName).toHaveBeenCalledWith('s1');
		});
	});

	describe('cancelDisabledDays', () => {
		it('should disable all days except next day of week', () => {
			(component as any).cancelShiftDay.set('Monday');
			const result: number[] = (component as any).cancelDisabledDays();
			// Monday index = 0, targetDayOfWeek = (0+1)%7 = 1 (Tuesday)
			// All disabled except index 1
			expect(result).not.toContain(1);
			expect(result).toContain(0);
			expect(result).toContain(2);
			expect(result).toContain(3);
			expect(result).toContain(4);
			expect(result).toContain(5);
			expect(result).toContain(6);
		});

		it('should return empty array when no day selected', () => {
			(component as any).cancelShiftDay.set(null);
			expect((component as any).cancelDisabledDays()).toEqual([]);
		});
	});

	describe('openAddScheduleDialog', () => {
		it('should set available days excluding scheduled ones', () => {
			mockScheduleService.schedules.mockReturnValue([
				{ day: 'Monday', shifts: [] },
				{ day: 'Wednesday', shifts: [] },
			]);

			(component as any).openAddScheduleDialog();

			const options = (component as any).dayOptions();
			expect(options.length).toBe(5);
			expect(options.map((o: { value: string }) => o.value)).not.toContain('Monday');
			expect(options.map((o: { value: string }) => o.value)).not.toContain('Wednesday');
		});

		it('should show all days when none scheduled', () => {
			mockScheduleService.schedules.mockReturnValue([]);

			(component as any).openAddScheduleDialog();

			expect((component as any).dayOptions().length).toBe(7);
		});
	});

	describe('openAddShiftDialog', () => {
		it('should set staff options and open dialog', () => {
			mockScheduleService.staff.mockReturnValue([
				{ id: 's1', firstName: 'John', lastName: 'Doe' },
				{ id: 's2', firstName: 'Jane', lastName: '' },
			]);

			(component as any).openAddShiftDialog('Monday');

			expect((component as any).selectedShiftDay()).toBe('Monday');
			expect((component as any).staffOptions()).toEqual([
				{ label: 'John Doe', value: 's1' },
				{ label: 'Jane', value: 's2' },
			]);
			expect((component as any).addShiftDialogVisible()).toBe(true);
		});
	});

	describe('_formatTimeForApi', () => {
		it('should format time with padded zeros', () => {
			const date = new Date(2025, 0, 1, 9, 5, 3);
			const result: string = (component as any)._formatTimeForApi(date);
			expect(result).toBe('09:05:03');
		});

		it('should format midnight', () => {
			const date = new Date(2025, 0, 1, 0, 0, 0);
			const result: string = (component as any)._formatTimeForApi(date);
			expect(result).toBe('00:00:00');
		});
	});

	describe('_formatDateForApi', () => {
		it('should format date in ISO-like format', () => {
			const date = new Date(2025, 0, 15, 14, 30, 45);
			const result: string = (component as any)._formatDateForApi(date);
			expect(result).toBe('2025-01-15T14:30:45Z');
		});
	});

	describe('_snapToTenMinutes', () => {
		it('should snap to next 10-minute mark when remainder > 0', () => {
			const date = new Date(2025, 0, 1, 9, 7, 0);
			const result: Date = (component as any)._snapToTenMinutes(date);
			expect(result.getMinutes()).toBe(10);
		});

		it('should keep exact 10-minute mark', () => {
			const date = new Date(2025, 0, 1, 9, 20, 0);
			const result: Date = (component as any)._snapToTenMinutes(date);
			expect(result.getMinutes()).toBe(20);
		});

		it('should snap 0 minutes to 0', () => {
			const date = new Date(2025, 0, 1, 9, 0, 30);
			const result: Date = (component as any)._snapToTenMinutes(date);
			expect(result.getMinutes()).toBe(0);
			expect(result.getSeconds()).toBe(0);
		});
	});
});
