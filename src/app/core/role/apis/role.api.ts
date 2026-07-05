import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Role } from '../models/role.model';

export interface CreateRoleRequest {
	roleName: string;
	roleDescription: string | null;
	permissionsIds: string[];
}

@Injectable({ providedIn: 'root' })
export class RoleApi {
	private readonly _http = inject(HttpClient);

	public getRoles(organizationId: string): Observable<Role[]> {
		return this._http.get<Role[]>(
			`${environment.apiBaseUrl}/Staffs/organizations/${organizationId}/roles`,
		);
	}

	public createRole(organizationId: string, request: CreateRoleRequest): Observable<Role> {
		return this._http.post<Role>(
			`${environment.apiBaseUrl}/Staffs/organizations/${organizationId}/role`,
			request,
		);
	}
}
