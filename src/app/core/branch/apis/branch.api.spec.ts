import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BranchApi } from './branch.api';
import { environment } from '../../../../environments/environment';

describe('BranchApi', () => {
	let api: BranchApi;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [BranchApi, provideHttpClient(), provideHttpClientTesting()],
		});
		api = TestBed.inject(BranchApi);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe('getBranches', () => {
		it('should GET branches with default pagination', () => {
			const response = {
				items: [],
				page: '1',
				pageSize: '10',
				totalCount: '0',
				count: '0',
				totalPages: '0',
				hasNextPage: false,
				hasPreviousPage: false,
				nextPage: null,
				previousPage: null,
			};

			api.getBranches('org-1').subscribe((result) => {
				expect(result).toEqual(response);
			});

			const req = httpMock.expectOne((r) =>
				r.url === `${environment.apiBaseUrl}/Branches` &&
				r.params.get('organizationId') === 'org-1' &&
				r.params.get('page') === '1' &&
				r.params.get('pageSize') === '10',
			);
			expect(req.request.method).toBe('GET');
			req.flush(response);
		});

		it('should GET branches with custom pagination', () => {
			const response = { items: [], page: '2', pageSize: '5', totalCount: '20', count: '5', totalPages: '4', hasNextPage: true, hasPreviousPage: true, nextPage: '3', previousPage: '1' };

			api.getBranches('org-1', 2, 5).subscribe();

			const req = httpMock.expectOne((r) =>
				r.url === `${environment.apiBaseUrl}/Branches` &&
				r.params.get('page') === '2' &&
				r.params.get('pageSize') === '5',
			);
			req.flush(response);
		});
	});

	describe('createBranch', () => {
		it('should POST to create branch', () => {
			const request = {
				organizationId: 'org-1',
				addressNumber: '123',
				addressStreet: 'Main St',
				addressCity: 'Springfield',
				addressState: 'IL',
				addressCountryId: 'US',
				addressPostalCode: '62701',
				latitude: '39.78',
				longitude: '-89.65',
				contactEmail: 'test@test.com',
				servicesProvided: ['Hair'],
				timeZoneId: 'America/Chicago',
			};

			api.createBranch(request).subscribe((result) => {
				expect(result).toBe('new-branch-id');
			});

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/Branches`);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual(request);
			req.flush('new-branch-id');
		});
	});

	describe('getOrganizationServices', () => {
		it('should GET organization services', () => {
			const response = { servicesProvided: ['Hair', 'Nails', 'Spa'] };

			api.getOrganizationServices('org-1').subscribe((result) => {
				expect(result).toEqual(['Hair', 'Nails', 'Spa']);
			});

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/Organizations/org-1`);
			expect(req.request.method).toBe('GET');
			req.flush(response);
		});
	});

	describe('getBranchById', () => {
		it('should GET branch detail by ID', () => {
			const branch = {
				id: 'b1',
				organizationId: 'org-1',
				organizationName: 'Test Org',
				services: ['Hair'],
				address: '123 Main St',
				location: { longitude: '0', latitude: '0' },
				branchStatus: 0,
				contaceEmail: 'test@test.com',
				phoneNumbers: [],
				openedSinceUtc: '2024-01-01',
				isCurrentlyOpen: true,
			};

			api.getBranchById('b1').subscribe((result) => {
				expect(result.id).toBe('b1');
				expect(result.branchStatus).toBe(0);
			});

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/Branches/b1`);
			expect(req.request.method).toBe('GET');
			req.flush(branch);
		});
	});

	describe('updatePhoneNumbers', () => {
		it('should PUT phone numbers', () => {
			api.updatePhoneNumbers('b1', ['+1234567890', '+0987654321']).subscribe();

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/Branches/b1/phone-numbers`);
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual({ phoneNumbers: ['+1234567890', '+0987654321'] });
			req.flush({});
		});
	});

	describe('updateBranchStatus', () => {
		it('should PUT branch status', () => {
			api.updateBranchStatus('b1', 2).subscribe();

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/Branches/b1/status`);
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual({ status: 2 });
			req.flush({});
		});
	});

	describe('getCountries', () => {
		it('should GET countries', () => {
			const countries = [{ id: 'US', name: 'United States' }, { id: 'CA', name: 'Canada' }];

			api.getCountries().subscribe((result) => {
				expect(result.length).toBe(2);
			});

			const req = httpMock.expectOne(`${environment.apiBaseUrl}/Countries`);
			expect(req.request.method).toBe('GET');
			req.flush(countries);
		});
	});
});
