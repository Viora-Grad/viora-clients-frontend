import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { ScheduleService } from './schedule.service';
import { ScheduleApi } from '../apis/schedule.api';
import { Schedule, StaffOption } from '../models/schedule.model';

function createSchedule(overrides: Partial<Schedule> = {}): Schedule {
	return {
		day: 'Monday',
		shifts: [],
		...overrides,
	};
}

function createStaff(overrides: Partial<StaffOption> = {}): StaffOption {
	return {
		id: 's1',
		firstName: 'John',
		lastName: 'Doe',
		...overrides,
	};
}

describe('ScheduleService', () => {
	let service: ScheduleService;

	const mockScheduleApi = {
		getSchedules: vi.fn(),
		createSchedule: vi.fn(),
		createShift: vi.fn(),
		cancelShift: vi.fn(),
		deleteShift: vi.fn(),
		getStaff: vi.fn(),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				ScheduleService,
				{ provide: ScheduleApi, useValue: mockScheduleApi },
			],
		});

		service = TestBed.inject(ScheduleService);
		vi.clearAllMocks();
	});

	describe('initial state', () => {
		it('should have empty schedules and staff', () => {
			expect(service.schedules()).toEqual([]);
			expect(service.staff()).toEqual([]);
			expect(service.isLoading()).toBeFalsy();
			expect(service.error()).toBeNull();
		});
	});

	describe('loadSchedules', () => {
		it('should load schedules and set them', async () => {
			const schedules = [
				createSchedule({ day: 'Monday' }),
				createSchedule({ day: 'Tuesday' }),
			];
			mockScheduleApi.getSchedules.mockReturnValue(of(schedules));

			await service.loadSchedules('branch-1');

			expect(service.schedules()).toEqual(schedules);
			expect(service.isLoading()).toBeFalsy();
			expect(service.error()).toBeNull();
		});

		it('should set error on failure', async () => {
			mockScheduleApi.getSchedules.mockReturnValue(throwError(() => new Error('fail')));

			await service.loadSchedules('branch-1');

			expect(service.error()).toBe('Failed to load schedules');
			expect(service.isLoading()).toBeFalsy();
		});

		it('should set isLoading during loading', async () => {
			mockScheduleApi.getSchedules.mockReturnValue(of([]));

			await service.loadSchedules('branch-1');

			expect(service.isLoading()).toBeFalsy();
		});
	});

	describe('loadStaff', () => {
		it('should load staff and set them', async () => {
			const staff = [createStaff({ id: 's1' }), createStaff({ id: 's2' })];
			mockScheduleApi.getStaff.mockReturnValue(of(staff));

			await service.loadStaff('org-1');

			expect(service.staff()).toEqual(staff);
		});

		it('should silently handle errors', async () => {
			mockScheduleApi.getStaff.mockReturnValue(throwError(() => new Error('fail')));

			await service.loadStaff('org-1');

			expect(service.staff()).toEqual([]);
		});
	});

	describe('createSchedule', () => {
		it('should create schedule and reload', async () => {
			mockScheduleApi.createSchedule.mockReturnValue(of({}));
			mockScheduleApi.getSchedules.mockReturnValue(of([]));

			const result = await service.createSchedule({ branchId: 'b1', dayOfWeek: 'Monday' });

			expect(result).toBe(true);
			expect(mockScheduleApi.createSchedule).toHaveBeenCalledWith({ branchId: 'b1', dayOfWeek: 'Monday' });
			expect(mockScheduleApi.getSchedules).toHaveBeenCalledWith('b1');
		});

		it('should return false on failure', async () => {
			mockScheduleApi.createSchedule.mockReturnValue(throwError(() => new Error('fail')));

			const result = await service.createSchedule({ branchId: 'b1', dayOfWeek: 'Monday' });

			expect(result).toBe(false);
		});
	});

	describe('createShift', () => {
		it('should create shift and reload', async () => {
			mockScheduleApi.createShift.mockReturnValue(of({}));
			mockScheduleApi.getSchedules.mockReturnValue(of([]));

			const request = {
				branchId: 'b1',
				staffId: 's1',
				dayOfWeek: 'Monday',
				startTime: '09:00:00',
				endTime: '17:00:00',
			};
			const result = await service.createShift(request);

			expect(result).toBe(true);
			expect(mockScheduleApi.createShift).toHaveBeenCalledWith(request);
		});

		it('should return false on failure', async () => {
			mockScheduleApi.createShift.mockReturnValue(throwError(() => new Error('fail')));

			const result = await service.createShift({
				branchId: 'b1',
				staffId: 's1',
				dayOfWeek: 'Monday',
				startTime: '09:00:00',
				endTime: '17:00:00',
			});

			expect(result).toBe(false);
		});
	});

	describe('cancelShift', () => {
		it('should cancel shift and reload', async () => {
			mockScheduleApi.cancelShift.mockReturnValue(of({}));
			mockScheduleApi.getSchedules.mockReturnValue(of([]));

			const request = {
				shiftId: 'sh1',
				branchId: 'b1',
				cancellationDate: '2025-01-01T09:00:00Z',
				reason: 'Sick',
			};
			const result = await service.cancelShift(request, 'b1');

			expect(result).toBe(true);
			expect(mockScheduleApi.cancelShift).toHaveBeenCalledWith(request);
		});

		it('should return false on failure', async () => {
			mockScheduleApi.cancelShift.mockReturnValue(throwError(() => new Error('fail')));

			const result = await service.cancelShift(
				{ shiftId: 'sh1', branchId: 'b1', cancellationDate: '2025-01-01T09:00:00Z', reason: '' },
				'b1',
			);

			expect(result).toBe(false);
		});
	});

	describe('deleteShift', () => {
		it('should delete shift and reload', async () => {
			mockScheduleApi.deleteShift.mockReturnValue(of({}));
			mockScheduleApi.getSchedules.mockReturnValue(of([]));

			const result = await service.deleteShift('sh1', 'b1');

			expect(result).toBe(true);
			expect(mockScheduleApi.deleteShift).toHaveBeenCalledWith('sh1');
		});

		it('should return false on failure', async () => {
			mockScheduleApi.deleteShift.mockReturnValue(throwError(() => new Error('fail')));

			const result = await service.deleteShift('sh1', 'b1');

			expect(result).toBe(false);
		});
	});

	describe('getStaffName', () => {
		it('should return full name when staff exists', () => {
			service.staff.set([createStaff({ id: 's1', firstName: 'Jane', lastName: 'Smith' })]);

			expect(service.getStaffName('s1')).toBe('Jane Smith');
		});

		it('should return Unknown when staff not found', () => {
			service.staff.set([]);

			expect(service.getStaffName('unknown')).toBe('Unknown');
		});

		it('should return Unknown when name parts are empty', () => {
			service.staff.set([createStaff({ id: 's1', firstName: '', lastName: '' })]);

			expect(service.getStaffName('s1')).toBe('Unknown');
		});

		it('should return trimmed single name', () => {
			service.staff.set([createStaff({ id: 's1', firstName: 'Jane', lastName: '' })]);

			expect(service.getStaffName('s1')).toBe('Jane');
		});
	});
});
