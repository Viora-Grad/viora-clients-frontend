import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrganizationResponse, TenantApi } from '../apis/tenant.api';

@Injectable({ providedIn: 'root' })
export class TenantService {
	private readonly _tenantApi = inject(TenantApi);

	public resolveOrganization(slug: string): Observable<OrganizationResponse> {
		return this._tenantApi.resolveOrganization(slug);
	}

	public getSubdomain(): string | null {
		const hostname = window.location.hostname;
		const parts = hostname.split('.');

		if (parts.length <= 1) {
			return null;
		}

		console.log('Subdomain:', parts[0]);

		return parts[0];
	}
}
