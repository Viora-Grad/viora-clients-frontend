import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Role } from '../../role/models/role.model';
import { StaffListResponse } from '../dtos/staff.dto';
import { StaffDetail } from '../models/staff-detail.model';

export interface UpdateStaffRequest {
	firstName: string | null;
	lastName: string | null;
	username: string | null;
	password: string | null;
	dateOfBirth: string | null;
	gender: string | null;
	phoneNumber: string | null;
}

export interface UpdateStaffRolesRequest {
	roleIds: string[];
}

export interface UpdateStaffServicesRequest {
	serviceIds: string[];
}

@Injectable({ providedIn: 'root' })
export class StaffApi {
	private readonly _http = inject(HttpClient);

	public getStaff(organizationId: string, page = 1, pageSize = 10): Observable<StaffListResponse> {
		return this._http.get<StaffListResponse>(`${environment.apiBaseUrl}/Staffs`, {
			params: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				OrganizationId: organizationId,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				Page: page.toString(),
				// eslint-disable-next-line @typescript-eslint/naming-convention
				PageSize: pageSize.toString(),
			},
		});
	}

	public getStaffByBranch(
		branchId: string,
		page = 1,
		pageSize = 10,
	): Observable<StaffListResponse> {
		return this._http.get<StaffListResponse>(`${environment.apiBaseUrl}/Staffs`, {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			params: { BranchIds: branchId, Page: page.toString(), PageSize: pageSize.toString() },
		});
	}

	public getStaffById(id: string): Observable<StaffDetail> {
		return this._http.get<StaffDetail>(`${environment.apiBaseUrl}/Staffs/${id}`);
	}

	public updateStaff(id: string, request: UpdateStaffRequest): Observable<unknown> {
		return this._http.put(`${environment.apiBaseUrl}/Staffs/${id}`, request);
	}

	public deleteStaff(id: string): Observable<unknown> {
		return this._http.delete(`${environment.apiBaseUrl}/Staffs/${id}`);
	}

	public getRoles(organizationId: string): Observable<Role[]> {
		return this._http.get<Role[]>(
			`${environment.apiBaseUrl}/Staffs/organizations/${organizationId}/roles`,
		);
	}

	public updateStaffRoles(id: string, request: UpdateStaffRolesRequest): Observable<unknown> {
		return this._http.patch(`${environment.apiBaseUrl}/Staffs/${id}/role`, request);
	}

	public updateStaffServices(id: string, request: UpdateStaffServicesRequest): Observable<unknown> {
		return this._http.patch(`${environment.apiBaseUrl}/Staffs/${id}/services`, request);
	}
}
