import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BranchDetailsPage } from './branch-details.page';
import { BranchApi } from '../../../../core/branch/apis/branch.api';

const PHONE_REGEX = /^\+\d[\d\s\-()]{6,19}$/;

describe('BranchDetailsPage', () => {
	let component: BranchDetailsPage;

	const mockBranchApi = {
		getBranchById: vi.fn(),
		updatePhoneNumbers: vi.fn(),
		updateBranchStatus: vi.fn(),
	};

	const mockActivatedRoute = {
		snapshot: {
			paramMap: { get: vi.fn().mockReturnValue('b1') },
		},
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				{ provide: BranchApi, useValue: mockBranchApi },
				{ provide: ActivatedRoute, useValue: mockActivatedRoute },
				{ provide: Location, useValue: { back: vi.fn() } },
			],
		});
		const fixture = TestBed.createComponent(BranchDetailsPage);
		component = fixture.componentInstance;
		vi.clearAllMocks();
	});

	describe('getStatusLabel', () => {
		it('should return Active for status 0', () => {
			expect((component as any).getStatusLabel(0)).toBe('Active');
		});

		it('should return Hidden for status 1', () => {
			expect((component as any).getStatusLabel(1)).toBe('Hidden');
		});

		it('should return Disabled for status 2', () => {
			expect((component as any).getStatusLabel(2)).toBe('Disabled');
		});

		it('should return Closed for status 3', () => {
			expect((component as any).getStatusLabel(3)).toBe('Closed');
		});

		it('should return Unknown for unknown status', () => {
			expect((component as any).getStatusLabel(99)).toBe('Unknown');
		});
	});

	describe('getStatusClass', () => {
		it('should return green classes for Active', () => {
			expect((component as any).getStatusClass(0)).toBe('bg-green-100 text-green-700');
		});

		it('should return yellow classes for Hidden', () => {
			expect((component as any).getStatusClass(1)).toBe('bg-yellow-100 text-yellow-700');
		});

		it('should return orange classes for Disabled', () => {
			expect((component as any).getStatusClass(2)).toBe('bg-orange-100 text-orange-700');
		});

		it('should return red classes for Closed', () => {
			expect((component as any).getStatusClass(3)).toBe('bg-red-100 text-red-700');
		});

		it('should return gray classes for unknown status', () => {
			expect((component as any).getStatusClass(99)).toBe('bg-gray-100 text-gray-700');
		});
	});

	describe('addPhoneNumber', () => {
		it('should add valid phone number', () => {
			(component as any).newPhoneNumber.set('+1234567890');
			(component as any).addPhoneNumber();

			expect((component as any).phoneNumbers()).toEqual(['+1234567890']);
			expect((component as any).newPhoneNumber()).toBe('');
			expect((component as any).phoneError()).toBe('');
		});

		it('should set error for empty number', () => {
			(component as any).newPhoneNumber.set('');
			(component as any).addPhoneNumber();

			expect((component as any).phoneError()).toBe('Phone number cannot be empty.');
			expect((component as any).phoneNumbers()).toEqual([]);
		});

		it('should set error for number not starting with +', () => {
			(component as any).newPhoneNumber.set('1234567890');
			(component as any).addPhoneNumber();

			expect((component as any).phoneError()).toBe('Phone number must start with + for the country code.');
			expect((component as any).phoneNumbers()).toEqual([]);
		});

		it('should set error for invalid format', () => {
			(component as any).newPhoneNumber.set('+abc');
			(component as any).addPhoneNumber();

			expect((component as any).phoneError()).toBe('Invalid phone number format. Example: +1234567890');
			expect((component as any).phoneNumbers()).toEqual([]);
		});

		it('should accept number with spaces and dashes', () => {
			(component as any).newPhoneNumber.set('+1 (234) 567-8901');
			(component as any).addPhoneNumber();

			expect((component as any).phoneNumbers()).toEqual(['+1 (234) 567-8901']);
		});

		it('should trim the input', () => {
			(component as any).newPhoneNumber.set('  +1234567890  ');
			(component as any).addPhoneNumber();

			expect((component as any).phoneNumbers()).toEqual(['+1234567890']);
		});

		it('should allow adding multiple numbers', () => {
			(component as any).newPhoneNumber.set('+1234567890');
			(component as any).addPhoneNumber();
			(component as any).newPhoneNumber.set('+0987654321');
			(component as any).addPhoneNumber();

			expect((component as any).phoneNumbers()).toEqual(['+1234567890', '+0987654321']);
		});
	});

	describe('removePhoneNumber', () => {
		it('should remove number at index', () => {
			(component as any).phoneNumbers.set(['+111', '+222', '+333']);
			(component as any).removePhoneNumber(1);

			expect((component as any).phoneNumbers()).toEqual(['+111', '+333']);
		});

		it('should remove first number', () => {
			(component as any).phoneNumbers.set(['+111', '+222']);
			(component as any).removePhoneNumber(0);

			expect((component as any).phoneNumbers()).toEqual(['+222']);
		});

		it('should remove last number', () => {
			(component as any).phoneNumbers.set(['+111', '+222']);
			(component as any).removePhoneNumber(1);

			expect((component as any).phoneNumbers()).toEqual(['+111']);
		});
	});

	describe('updatePhoneNumber', () => {
		it('should update number at index', () => {
			(component as any).phoneNumbers.set(['+111', '+222']);
			(component as any).updatePhoneNumber(0, '+999');

			expect((component as any).phoneNumbers()).toEqual(['+999', '+222']);
		});
	});

	describe('openPhoneDialog', () => {
		it('should initialize dialog with branch phone numbers', () => {
			(component as any).branch.set({
				id: 'b1',
				organizationId: 'org-1',
				organizationName: 'Test Org',
				services: [],
				address: '',
				location: { longitude: '0', latitude: '0' },
				branchStatus: 0,
				contaceEmail: '',
				phoneNumbers: ['+111', '+222'],
				openedSinceUtc: '',
				isCurrentlyOpen: true,
			});

			(component as any).openPhoneDialog();

			expect((component as any).phoneNumbers()).toEqual(['+111', '+222']);
			expect((component as any).newPhoneNumber()).toBe('');
			expect((component as any).phoneError()).toBe('');
			expect((component as any).isPhoneDialogVisible()).toBe(true);
		});

		it('should handle branch with no phone numbers', () => {
			(component as any).branch.set({
				id: 'b1',
				organizationId: 'org-1',
				organizationName: 'Test Org',
				services: [],
				address: '',
				location: { longitude: '0', latitude: '0' },
				branchStatus: 0,
				contaceEmail: '',
				phoneNumbers: [],
				openedSinceUtc: '',
				isCurrentlyOpen: true,
			});

			(component as any).openPhoneDialog();

			expect((component as any).phoneNumbers()).toEqual([]);
		});
	});

	describe('onStatusChange', () => {
		it('should not call API when new status equals current', () => {
			(component as any).branch.set({
				id: 'b1',
				organizationId: 'org-1',
				organizationName: 'Test Org',
				services: [],
				address: '',
				location: { longitude: '0', latitude: '0' },
				branchStatus: 0,
				contaceEmail: '',
				phoneNumbers: [],
				openedSinceUtc: '',
				isCurrentlyOpen: true,
			});

			(component as any).onStatusChange(0);

			expect(mockBranchApi.updateBranchStatus).not.toHaveBeenCalled();
		});

		it('should not call API when branch is null', () => {
			(component as any).branch.set(null);

			(component as any).onStatusChange(1);

			expect(mockBranchApi.updateBranchStatus).not.toHaveBeenCalled();
		});
	});

	describe('PHONE_REGEX validation', () => {
		it('should accept valid international numbers', () => {
			expect(PHONE_REGEX.test('+1234567890')).toBe(true);
			expect(PHONE_REGEX.test('+44123456789')).toBe(true);
			expect(PHONE_REGEX.test('+971501234567')).toBe(true);
		});

		it('should accept numbers with spaces and parentheses', () => {
			expect(PHONE_REGEX.test('+1 (234) 567-8901')).toBe(true);
			expect(PHONE_REGEX.test('+44 123 456 789')).toBe(true);
		});

		it('should reject numbers without + prefix', () => {
			expect(PHONE_REGEX.test('1234567890')).toBe(false);
		});

		it('should reject too short numbers', () => {
			expect(PHONE_REGEX.test('+12')).toBe(false);
		});

		it('should reject non-digit after +', () => {
			expect(PHONE_REGEX.test('+abc1234567')).toBe(false);
		});
	});
});
