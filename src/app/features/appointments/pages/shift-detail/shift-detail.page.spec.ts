import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ShiftDetailPage } from './shift-detail.page';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../models/appointment.model';
import { BranchStore } from '../../../../core/branch/stores/branch.store';

describe('ShiftDetailPage', () => {
	let component: ShiftDetailPage;

	const mockAppointmentService = {
		appointments: vi.fn().mockReturnValue([]),
		currentPage: vi.fn().mockReturnValue(1),
		pageSize: vi.fn().mockReturnValue(10),
		totalCount: vi.fn().mockReturnValue(0),
		totalPages: vi.fn().mockReturnValue(0),
		loadAppointments: vi.fn().mockResolvedValue(undefined),
	};

	const mockActivatedRoute = {
		snapshot: {
			paramMap: { get: vi.fn().mockReturnValue(null) },
			queryParamMap: { get: vi.fn().mockReturnValue(null) },
		},
	};

	const mockRouter = {
		navigate: vi.fn().mockResolvedValue(true),
	};

	const mockBranchStore = {
		currentBranchId: vi.fn().mockReturnValue('b1'),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				{ provide: AppointmentService, useValue: mockAppointmentService },
				{ provide: ActivatedRoute, useValue: mockActivatedRoute },
				{ provide: Router, useValue: mockRouter },
				{ provide: Location, useValue: { back: vi.fn() } },
				{ provide: BranchStore, useValue: mockBranchStore },
			],
		});
		const fixture = TestBed.createComponent(ShiftDetailPage);
		component = fixture.componentInstance;
		vi.clearAllMocks();
	});

	describe('STATUS_SEVERITY mapping', () => {
		it('should map completed to success', () => {
			expect((component as any).getStatusSeverity('completed')).toBe('success');
		});

		it('should map InProgress to info', () => {
			expect((component as any).getStatusSeverity('InProgress')).toBe('info');
		});

		it('should map confirmed to warn', () => {
			expect((component as any).getStatusSeverity('confirmed')).toBe('warn');
		});

		it('should map NotArrived to secondary', () => {
			expect((component as any).getStatusSeverity('NotArrived')).toBe('secondary');
		});

		it('should map cancelled to danger', () => {
			expect((component as any).getStatusSeverity('cancelled')).toBe('danger');
		});

		it('should map no-show to danger', () => {
			expect((component as any).getStatusSeverity('no-show')).toBe('danger');
		});

		it('should default unknown status to secondary', () => {
			expect((component as any).getStatusSeverity('unknown')).toBe('secondary');
		});
	});

	describe('getStatusLabel', () => {
		it('should capitalize first letter', () => {
			expect((component as any).getStatusLabel('completed')).toBe('Completed');
		});

		it('should replace hyphens with spaces', () => {
			expect((component as any).getStatusLabel('no-show')).toBe('No show');
		});

		it('should handle single character', () => {
			expect((component as any).getStatusLabel('a')).toBe('A');
		});
	});

	describe('getTimeRange', () => {
		it('should format time range correctly', () => {
			const result: string = (component as any).getTimeRange('2025-03-15T10:00:00Z', 60);
			expect(result).toContain('10:00 AM');
			expect(result).toContain('11:00 AM');
		});

		it('should handle PM times', () => {
			const result: string = (component as any).getTimeRange('2025-03-15T14:30:00Z', 30);
			expect(result).toContain('2:30 PM');
			expect(result).toContain('3:00 PM');
		});

		it('should handle midnight', () => {
			const result: string = (component as any).getTimeRange('2025-03-15T00:00:00Z', 60);
			expect(result).toContain('12:00 AM');
			expect(result).toContain('1:00 AM');
		});

		it('should handle noon', () => {
			const result: string = (component as any).getTimeRange('2025-03-15T12:00:00Z', 60);
			expect(result).toContain('12:00 PM');
			expect(result).toContain('1:00 PM');
		});
	});

	describe('navigateToAppointment', () => {
		it('should navigate to appointment route', async () => {
			const router = { navigate: vi.fn().mockResolvedValue(true) };
			(component as any)._router = router;

			await (component as any).navigateToAppointment('apt-1');

			expect(router.navigate).toHaveBeenCalledWith(['/branch-management/appointments', 'apt-1']);
		});
	});

	describe('computed: firstItemIndex', () => {
		it('should return 0 when totalCount is 0', () => {
			mockAppointmentService.totalCount.mockReturnValue(0);
			expect((component as any).firstItemIndex()).toBe(0);
		});

		it('should return correct first index', () => {
			mockAppointmentService.totalCount.mockReturnValue(25);
			mockAppointmentService.pageSize.mockReturnValue(10);
			mockAppointmentService.currentPage.mockReturnValue(3);
			expect((component as any).firstItemIndex()).toBe(21);
		});

		it('should return 1 on first page', () => {
			mockAppointmentService.totalCount.mockReturnValue(10);
			mockAppointmentService.pageSize.mockReturnValue(10);
			mockAppointmentService.currentPage.mockReturnValue(1);
			expect((component as any).firstItemIndex()).toBe(1);
		});
	});

	describe('computed: lastItemIndex', () => {
		it('should return min of currentPage * pageSize and totalCount', () => {
			mockAppointmentService.totalCount.mockReturnValue(25);
			mockAppointmentService.pageSize.mockReturnValue(10);
			mockAppointmentService.currentPage.mockReturnValue(3);
			expect((component as any).lastItemIndex()).toBe(25);
		});

		it('should return pageSize for full page', () => {
			mockAppointmentService.totalCount.mockReturnValue(25);
			mockAppointmentService.pageSize.mockReturnValue(10);
			mockAppointmentService.currentPage.mockReturnValue(1);
			expect((component as any).lastItemIndex()).toBe(10);
		});
	});

	describe('computed: visiblePages', () => {
		it('should show pages around current', () => {
			mockAppointmentService.currentPage.mockReturnValue(5);
			mockAppointmentService.totalPages.mockReturnValue(10);
			expect((component as any).visiblePages()).toEqual([3, 4, 5, 6, 7]);
		});

		it('should clamp at start', () => {
			mockAppointmentService.currentPage.mockReturnValue(1);
			mockAppointmentService.totalPages.mockReturnValue(10);
			expect((component as any).visiblePages()).toEqual([1, 2, 3, 4, 5]);
		});

		it('should clamp at end', () => {
			mockAppointmentService.currentPage.mockReturnValue(10);
			mockAppointmentService.totalPages.mockReturnValue(10);
			expect((component as any).visiblePages()).toEqual([6, 7, 8, 9, 10]);
		});

		it('should handle fewer than maxVisible pages', () => {
			mockAppointmentService.currentPage.mockReturnValue(1);
			mockAppointmentService.totalPages.mockReturnValue(3);
			expect((component as any).visiblePages()).toEqual([1, 2, 3]);
		});
	});

	describe('_deriveCurrentAndUpcoming', () => {
		it('should set current to InProgress appointment', () => {
			const appointments: Appointment[] = [
				{ id: 'a1', status: 'NotArrived', startTime: '2025-03-15T09:00:00Z', customerName: 'C1', serviceName: 'S1', staffName: 'ST1', estimatedDurationMinutes: 30 },
				{ id: 'a2', status: 'InProgress', startTime: '2025-03-15T10:00:00Z', customerName: 'C2', serviceName: 'S2', staffName: 'ST2', estimatedDurationMinutes: 30 },
			];
			mockAppointmentService.appointments.mockReturnValue(appointments);

			(component as any)._deriveCurrentAndUpcoming();

			expect((component as any).currentAppointment().id).toBe('a2');
		});

		it('should set current to earliest NotArrived when no InProgress', () => {
			const appointments: Appointment[] = [
				{ id: 'a1', status: 'NotArrived', startTime: '2025-03-15T10:00:00Z', customerName: 'C1', serviceName: 'S1', staffName: 'ST1', estimatedDurationMinutes: 30 },
				{ id: 'a2', status: 'NotArrived', startTime: '2025-03-15T09:00:00Z', customerName: 'C2', serviceName: 'S2', staffName: 'ST2', estimatedDurationMinutes: 30 },
			];
			mockAppointmentService.appointments.mockReturnValue(appointments);

			(component as any)._deriveCurrentAndUpcoming();

			expect((component as any).currentAppointment().id).toBe('a2');
		});

		it('should set upcoming to second NotArrived', () => {
			const appointments: Appointment[] = [
				{ id: 'a1', status: 'NotArrived', startTime: '2025-03-15T09:00:00Z', customerName: 'C1', serviceName: 'S1', staffName: 'ST1', estimatedDurationMinutes: 30 },
				{ id: 'a2', status: 'NotArrived', startTime: '2025-03-15T10:00:00Z', customerName: 'C2', serviceName: 'S2', staffName: 'ST2', estimatedDurationMinutes: 30 },
			];
			mockAppointmentService.appointments.mockReturnValue(appointments);

			(component as any)._deriveCurrentAndUpcoming();

			expect((component as any).currentAppointment().id).toBe('a1');
			expect((component as any).upcomingAppointment().id).toBe('a2');
		});

		it('should set both to null when no appointments', () => {
			mockAppointmentService.appointments.mockReturnValue([]);

			(component as any)._deriveCurrentAndUpcoming();

			expect((component as any).currentAppointment()).toBeNull();
			expect((component as any).upcomingAppointment()).toBeNull();
		});
	});
});
