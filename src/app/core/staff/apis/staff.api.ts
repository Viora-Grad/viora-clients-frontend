import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StaffListResponse } from '../dtos/staff.dto';

@Injectable({ providedIn: 'root' })
export class StaffApi {
	private readonly _http = inject(HttpClient);

	public getStaff(
		organizationId: string,
		page = 1,
		pageSize = 10,
	): Observable<StaffListResponse> {
		return this._http.get<StaffListResponse>(`${environment.apiBaseUrl}/Staffs`, {
			params: { organizationId, page: page.toString(), pageSize: pageSize.toString() },
		});
	}
}
