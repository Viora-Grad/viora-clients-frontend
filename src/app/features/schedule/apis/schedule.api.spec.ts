import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ScheduleApi } from './schedule.api';
import { environment } from '../../../../environments/environment';

describe('ScheduleApi', () => {
	let api: ScheduleApi;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ScheduleApi, provideHttpClient(), provideHttpClientTesting()],
		});
		api = TestBed.inject(ScheduleApi);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe('getSchedules', () => {
		it('should GET schedules and map response', () => {
			const apiResponse = [
				{ day: 'Monday', shifts: [{ shiftId: 'sh1', staffId: 's1', startTime: '09:00', endTime: '17:00' }] },
			];

			api.getSchedules('branch-1').subscribe((result) => {
				expect(result.length).toBe(1);
				expect(result[0].day).toBe('Monday');
				expect(result[0].shifts[0].shiftId).toBe('sh1');
			});

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/schedule/branch-1`);
			expect(req.request.method).toBe('GET');
			req.flush(apiResponse);
		});
	});

	describe('createSchedule', () => {
		it('should POST to create schedule', () => {
			api.createSchedule({ branchId: 'b1', dayOfWeek: 'Monday' }).subscribe();

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/schedule/create`);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ branchId: 'b1', dayOfWeek: 'Monday' });
			req.flush({});
		});
	});

	describe('createShift', () => {
		it('should POST to create shift', () => {
			const request = {
				branchId: 'b1',
				staffId: 's1',
				dayOfWeek: 'Monday',
				startTime: '09:00:00',
				endTime: '17:00:00',
			};

			api.createShift(request).subscribe();

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/schedule/shift/create`);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual(request);
			req.flush({});
		});
	});

	describe('cancelShift', () => {
		it('should POST to cancel shift', () => {
			const request = {
				shiftId: 'sh1',
				branchId: 'b1',
				cancellationDate: '2025-01-01T09:00:00Z',
				reason: 'Sick',
			};

			api.cancelShift(request).subscribe();

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/schedule/cancel`);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual(request);
			req.flush({});
		});
	});

	describe('deleteShift', () => {
		it('should DELETE shift by ID', () => {
			api.deleteShift('sh1').subscribe();

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/schedule/shift/delete/sh1`);
			expect(req.request.method).toBe('DELETE');
			req.flush({});
		});
	});

	describe('getStaff', () => {
		it('should GET staff and map response', () => {
			const apiResponse = {
				items: [
					{ id: 's1', firstName: 'John', lastName: 'Doe' },
					{ id: 's2', firstName: 'Jane', lastName: 'Smith' },
				],
			};

			api.getStaff('org-1').subscribe((result) => {
				expect(result.length).toBe(2);
				expect(result[0]).toEqual({ id: 's1', firstName: 'John', lastName: 'Doe' });
				expect(result[1]).toEqual({ id: 's2', firstName: 'Jane', lastName: 'Smith' });
			});

			const req = httpMock.expectOne((r) =>
				r.url === `${environment.apiBaseUrl}/Staffs` &&
				r.params.get('organizationId') === 'org-1' &&
				r.params.get('page') === '1' &&
				r.params.get('pageSize') === '100',
			);
			expect(req.request.method).toBe('GET');
			req.flush(apiResponse);
		});
	});
});
