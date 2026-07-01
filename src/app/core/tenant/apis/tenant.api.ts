import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface OrganizationResponse {
	organizationId: string;
}

@Injectable({ providedIn: 'root' })
export class TenantApi {
	private readonly _http = inject(HttpClient);

	public resolveOrganization(slug: string): Observable<OrganizationResponse> {
		return this._http.get<OrganizationResponse>(`${environment.apiBaseUrl}/tenants/${slug}`);
	}
}
