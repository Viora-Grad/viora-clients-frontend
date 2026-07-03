import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BranchListResponse } from '../dtos/branch.dto';

@Injectable({ providedIn: 'root' })
export class BranchApi {
	private readonly _http = inject(HttpClient);

	public getBranches(organizationId: string): Observable<BranchListResponse> {
		return this._http.get<BranchListResponse>(`${environment.apiBaseUrl}/Branches`, {
			params: { organizationId },
		});
	}
}
