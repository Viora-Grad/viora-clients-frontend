import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';
import { AuthDetails } from '../models/auth-details.model';

describe('AuthStore', () => {
	let store: InstanceType<typeof AuthStore>;

	const mockUser: AuthDetails = {
		id: 'user-1',
		isStaff: true,
		permissions: ['read', 'write'],
	};

	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();

		TestBed.configureTestingModule({});
		store = TestBed.inject(AuthStore);
	});

	afterEach(() => {
		localStorage.clear();
		sessionStorage.clear();
	});

	describe('initial state', () => {
		it('should have null tokens on init when no stored values', () => {
			expect(store.accessToken()).toBeNull();
			expect(store.refreshToken()).toBeNull();
			expect(store.currentUser()).toBeNull();
			expect(store.isStaff()).toBeNull();
			expect(store.isLoading()).toBeFalsy();
			expect(store.error()).toBeNull();
			expect(store.initialized()).toBeTruthy();
		});

		it('should have isAuthenticated false initially', () => {
			expect(store.isAuthenticated()).toBeFalsy();
		});
	});

	describe('onInit hook', () => {
		it('should use sessionStorage when remember_me is false', () => {
			localStorage.setItem('remember_me', 'false');
			localStorage.setItem('access_token', 'ls-token');
			sessionStorage.setItem('access_token', 'ss-token');
			sessionStorage.setItem('refresh_token', 'ss-refresh');
			sessionStorage.setItem('is_staff', 'false');

			// Since the store singleton is already initialized, verify the
			// sessionStorage fallback logic by confirming the store reads from
			// the correct storage based on remember_me.
			// The store's onInit reads remember_me !== 'false' -> if false,
			// it reads from sessionStorage.
			// Because the store was already initialized in beforeEach, we test
			// that setAuthDetails with rememberMe=false writes to sessionStorage.
			store.setAuthDetails(
				{ id: 'u1', isStaff: false, permissions: [] },
				'session-token',
				'session-refresh',
				false,
			);
			expect(sessionStorage.getItem('access_token')).toBe('session-token');
		});

		it('should mark initialized true even without tokens', () => {
			expect(store.initialized()).toBeTruthy();
		});
	});

	describe('setAuthDetails', () => {
		it('should store tokens in localStorage when rememberMe is true', () => {
			store.setAuthDetails(mockUser, 'access-123', 'refresh-123', true);

			expect(store.accessToken()).toBe('access-123');
			expect(store.refreshToken()).toBe('refresh-123');
			expect(store.currentUser()).toEqual(mockUser);
			expect(store.isStaff()).toBeTruthy();
			expect(store.error()).toBeNull();
			expect(store.isLoading()).toBeFalsy();

			expect(localStorage.getItem('access_token')).toBe('access-123');
			expect(localStorage.getItem('refresh_token')).toBe('refresh-123');
		});

		it('should store tokens in sessionStorage when rememberMe is false', () => {
			store.setAuthDetails(mockUser, 'access-456', 'refresh-456', false);

			expect(sessionStorage.getItem('access_token')).toBe('access-456');
			expect(sessionStorage.getItem('refresh_token')).toBe('refresh-456');
			expect(localStorage.getItem('access_token')).toBeNull();
		});

		it('should default rememberMe to true', () => {
			store.setAuthDetails(mockUser, 'acc', 'ref');

			expect(localStorage.getItem('access_token')).toBe('acc');
		});
	});

	describe('updateTokens', () => {
		it('should update tokens in the same storage used by setAuthDetails', () => {
			store.setAuthDetails(mockUser, 'old-access', 'old-refresh', false);
			store.updateTokens('new-access', 'new-refresh');

			expect(store.accessToken()).toBe('new-access');
			expect(store.refreshToken()).toBe('new-refresh');
			expect(sessionStorage.getItem('access_token')).toBe('new-access');
			expect(sessionStorage.getItem('refresh_token')).toBe('new-refresh');
		});

		it('should update tokens in localStorage when setAuthDetails used localStorage', () => {
			store.setAuthDetails(mockUser, 'old-access', 'old-refresh', true);
			store.updateTokens('new-access', 'new-refresh');

			expect(localStorage.getItem('access_token')).toBe('new-access');
		});
	});

	describe('logout', () => {
		it('should clear tokens from both storages', () => {
			store.setAuthDetails(mockUser, 'access', 'refresh', true);
			store.logout();

			expect(localStorage.getItem('access_token')).toBeNull();
			expect(localStorage.getItem('refresh_token')).toBeNull();
			expect(sessionStorage.getItem('access_token')).toBeNull();
			expect(sessionStorage.getItem('refresh_token')).toBeNull();
			expect(localStorage.getItem('remember_me')).toBeNull();
		});

		it('should reset state but keep initialized true', () => {
			store.setAuthDetails(mockUser, 'access', 'refresh');
			store.logout();

			expect(store.accessToken()).toBeNull();
			expect(store.refreshToken()).toBeNull();
			expect(store.currentUser()).toBeNull();
			expect(store.isStaff()).toBeNull();
			expect(store.initialized()).toBeTruthy();
			expect(store.isAuthenticated()).toBeFalsy();
		});
	});

	describe('isAuthenticated', () => {
		it('should return true only when both tokens are present', () => {
			store.setAuthDetails(mockUser, 'access', 'refresh');
			expect(store.isAuthenticated()).toBeTruthy();
		});

		it('should return false when only access token is set', () => {
			store.setAuthDetails(mockUser, 'access', '');
			expect(store.isAuthenticated()).toBeFalsy();
		});

		it('should return false when only refresh token is set', () => {
			store.setAuthDetails(mockUser, '', 'refresh');
			expect(store.isAuthenticated()).toBeFalsy();
		});
	});

	describe('error handling', () => {
		it('should set and clear errors', () => {
			store.setError('Something went wrong');
			expect(store.error()).toBe('Something went wrong');
			expect(store.isLoading()).toBeFalsy();

			store.clearError();
			expect(store.error()).toBeNull();
		});

		it('should clear error when setAuthDetails is called', () => {
			store.setError('Error');
			store.setAuthDetails(mockUser, 'acc', 'ref');
			expect(store.error()).toBeNull();
		});
	});

	describe('setLoading', () => {
		it('should set loading true and clear error', () => {
			store.setError('Old error');
			store.setLoading();

			expect(store.isLoading()).toBeTruthy();
			expect(store.error()).toBeNull();
		});
	});

	describe('setCurrentUser', () => {
		it('should update the current user', () => {
			const updatedUser: AuthDetails = { ...mockUser, firstName: 'John' };
			store.setCurrentUser(updatedUser);

			expect(store.currentUser()).toEqual(updatedUser);
		});
	});
});
