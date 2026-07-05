import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleApi, CreateRoleRequest } from '../apis/role.api';
import { Role } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
	private readonly _roleApi = inject(RoleApi);

	public getRoles(organizationId: string): Observable<Role[]> {
		return this._roleApi.getRoles(organizationId);
	}

	public createRole(organizationId: string, request: CreateRoleRequest): Observable<Role> {
		return this._roleApi.createRole(organizationId, request);
	}
}
