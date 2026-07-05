import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BranchListResponse } from '../../branch/dtos/branch.dto';
import { Role } from '../../role/models/role.model';
import { CreateStaffInvitationRequest } from '../dtos/invitation.dto';

@Injectable({ providedIn: 'root' })
export class StaffInvitationApi {
	private readonly _http = inject(HttpClient);

	public getRoles(organizationId: string): Observable<Role[]> {
		return this._http.get<Role[]>(
			`${environment.apiBaseUrl}/Staffs/organizations/${organizationId}/roles`,
		);
	}

	public getBranches(organizationId: string): Observable<BranchListResponse> {
		return this._http.get<BranchListResponse>(`${environment.apiBaseUrl}/Branches`, {
			params: { organizationId },
		});
	}

	public createInvitation(
		organizationId: string,
		request: CreateStaffInvitationRequest,
	): Observable<string> {
		return this._http.post(
			`${environment.apiBaseUrl}/Staffs/organizations/${organizationId}/invitation`,
			request,
			{ responseType: 'text' },
		);
	}
}
