import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from '../stores/auth.store';
import { AuthApi } from '../apis/auth.api';
import { TenantStore } from '../../tenant/stores/tenant.store';
import { BranchStore } from '../../branch/stores/branch.store';

describe('AuthService', () => {
	let service: AuthService;
	let authStore: InstanceType<typeof AuthStore>;

	const mockAuthApi = {
		login: vi.fn(),
		refreshToken: vi.fn(),
		staffRefreshToken: vi.fn(),
		getStaffMe: vi.fn(),
		getMe: vi.fn(),
		getPermissions: vi.fn(),
	};

	const mockTenantStore = {
		organizationId: vi.fn().mockReturnValue('org-1'),
	};

	const mockRouter = {
		navigate: vi.fn().mockResolvedValue(true),
	};

	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				AuthService,
				{ provide: AuthApi, useValue: mockAuthApi },
				{ provide: TenantStore, useValue: mockTenantStore },
				{ provide: Router, useValue: mockRouter },
			],
		});

		service = TestBed.inject(AuthService);
		authStore = TestBed.inject(AuthStore);

		vi.clearAllMocks();
	});

	afterEach(() => {
		localStorage.clear();
		sessionStorage.clear();
	});

	describe('login', () => {
		it('should return false and set error when organizationId is missing', async () => {
			mockTenantStore.organizationId.mockReturnValue(null);

			const result = await service.login('user', 'pass');

			expect(result).toBe(false);
			expect(authStore.error()).toBe('Organization not resolved. Please try again.');
		});
	});

	describe('refresh', () => {
		it('should return false when no refresh token', async () => {
			const result = await service.refresh();
			expect(result).toBe(false);
		});

		it('should call staffRefreshToken for staff users', async () => {
			authStore.setAuthDetails(
				{ id: 'u1', isStaff: true, permissions: [] },
				'old-acc',
				'old-ref',
			);
			mockAuthApi.staffRefreshToken.mockReturnValue(of({
				userId: 'u1',
				accessToken: 'new-acc',
				refreshToken: 'new-ref',
				permissions: [],
			}));
			mockAuthApi.getStaffMe.mockReturnValue(of({
				id: 'u1',
				firstName: 'A',
				lastName: 'B',
				branches: [],
			}));

			const result = await service.refresh();

			expect(result).toBe(true);
			expect(authStore.accessToken()).toBe('new-acc');
			expect(mockAuthApi.staffRefreshToken).toHaveBeenCalledWith('old-ref');
		});

		it('should call refreshToken for non-staff users', async () => {
			authStore.setAuthDetails(
				{ id: 'u1', isStaff: false, permissions: [] },
				'old-acc',
				'old-ref',
			);
			mockAuthApi.refreshToken.mockReturnValue(of({
				userId: 'u1',
				accessToken: 'new-acc',
				refreshToken: null,
				permissions: [],
			}));
			mockAuthApi.getMe.mockReturnValue(of({
				firstName: 'A',
				lastName: 'B',
				email: 'a@b.com',
				dateOfBirth: '',
				gender: '',
			}));

			const result = await service.refresh();

			expect(result).toBe(true);
			expect(authStore.accessToken()).toBe('new-acc');
			expect(authStore.refreshToken()).toBe('old-ref');
			expect(mockAuthApi.refreshToken).toHaveBeenCalledWith('old-ref');
		});

		it('should logout on refresh failure', async () => {
			authStore.setAuthDetails(
				{ id: 'u1', isStaff: true, permissions: [] },
				'acc',
				'ref',
			);
			mockAuthApi.staffRefreshToken.mockReturnValue(throwError(() => new Error('expired')));

			const result = await service.refresh();

			expect(result).toBe(false);
			expect(authStore.accessToken()).toBeNull();
			expect(authStore.isAuthenticated()).toBe(false);
		});
	});

	describe('logout', () => {
		it('should clear store and navigate to login', () => {
			authStore.setAuthDetails(
				{ id: 'u1', isStaff: true, permissions: [] },
				'acc',
				'ref',
			);

			service.logout();

			expect(authStore.accessToken()).toBeNull();
			expect(authStore.isAuthenticated()).toBe(false);
			expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
		});
	});

	describe('fetchCurrentUser', () => {
		it('should return early when isStaff is null', async () => {
			await service.fetchCurrentUser();
			expect(mockAuthApi.getStaffMe).not.toHaveBeenCalled();
			expect(mockAuthApi.getMe).not.toHaveBeenCalled();
		});

		it('should fetch staff user details', async () => {
			authStore.setAuthDetails(
				{ id: 'u1', isStaff: true, permissions: [] },
				'acc',
				'ref',
			);
			mockAuthApi.getStaffMe.mockReturnValue(of({
				id: 'u1',
				firstName: 'John',
				lastName: 'Doe',
				branches: [],
			}));

			await service.fetchCurrentUser();

			expect(mockAuthApi.getStaffMe).toHaveBeenCalled();
			const user = authStore.currentUser();
			expect(user?.firstName).toBe('John');
			expect(user?.lastName).toBe('Doe');
		});

		it('should fetch owner user details', async () => {
			authStore.setAuthDetails(
				{ id: 'u1', isStaff: false, permissions: [] },
				'acc',
				'ref',
			);
			mockAuthApi.getMe.mockReturnValue(of({
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@example.com',
				dateOfBirth: '1990-01-01',
				gender: 'female',
			}));

			await service.fetchCurrentUser();

			expect(mockAuthApi.getMe).toHaveBeenCalled();
			const user = authStore.currentUser();
			expect(user?.firstName).toBe('Jane');
			expect(user?.email).toBe('jane@example.com');
		});

		it('should silently fail on error', async () => {
			authStore.setAuthDetails(
				{ id: 'u1', isStaff: true, permissions: [] },
				'acc',
				'ref',
			);
			mockAuthApi.getStaffMe.mockReturnValue(throwError(() => new Error('fail')));

			await service.fetchCurrentUser();

			expect(authStore.currentUser()?.id).toBe('u1');
		});
	});
});
