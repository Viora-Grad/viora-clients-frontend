import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map as rxjsMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BranchListResponse } from '../dtos/branch.dto';
import { BranchDetail } from '../models/branch-detail.model';
import { Country } from '../models/country.model';

export interface CreateBranchRequest {
	organizationId: string;
	addressNumber: string;
	addressStreet: string;
	addressCity: string;
	addressState: string;
	addressCountryId: string;
	addressPostalCode: string;
	latitude: string;
	longitude: string;
	contactEmail: string;
	servicesProvided: string[];
	timeZoneId: string;
}

@Injectable({ providedIn: 'root' })
export class BranchApi {
	private readonly _http = inject(HttpClient);

	public getBranches(
		organizationId: string,
		page = 1,
		pageSize = 10,
	): Observable<BranchListResponse> {
		return this._http.get<BranchListResponse>(`${environment.apiBaseUrl}/Branches`, {
			params: { organizationId, page: page.toString(), pageSize: pageSize.toString() },
		});
	}

	public createBranch(request: CreateBranchRequest): Observable<unknown> {
		return this._http.post(`${environment.apiBaseUrl}/Branches`, request);
	}

	public getOrganizationServices(organizationId: string): Observable<string[]> {
		return this._http.get<{ servicesProvided: string[] }>(
			`${environment.apiBaseUrl}/Organizations/${organizationId}`,
		).pipe(
			rxjsMap((response) => response.servicesProvided),
		);
	}

	public getBranchById(id: string): Observable<BranchDetail> {
		return this._http.get<BranchDetail>(`${environment.apiBaseUrl}/Branches/${id}`);
	}

	public updatePhoneNumbers(branchId: string, phoneNumbers: string[]): Observable<unknown> {
		return this._http.put(`${environment.apiBaseUrl}/Branches/${branchId}/phone-numbers`, { phoneNumbers });
	}

	public updateBranchStatus(branchId: string, status: number): Observable<unknown> {
		return this._http.put(`${environment.apiBaseUrl}/Branches/${branchId}/status`, { status });
	}

	public getCountries(): Observable<Country[]> {
		return this._http.get<Country[]>(`${environment.apiBaseUrl}/Countries`);
	}
}
