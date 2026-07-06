import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppointmentListResponse, GetAppointmentsRequest } from '../dtos/appointment.dto';

@Injectable({ providedIn: 'root' })
export class AppointmentApi {
	private readonly _http = inject(HttpClient);

	public getAppointments(request: GetAppointmentsRequest): Observable<AppointmentListResponse> {
		const params: Record<string, string | boolean> = {
			Page: (request.page ?? 1).toString(),
			PageSize: (request.pageSize ?? 10).toString(),
			IncludeCustomerObject: true,
			IncludeStaffObject: true,
			IncludeServiceObject: true,
		};

		if (request.serviceId) params['ServiceId'] = request.serviceId;
		if (request.staffId) params['StaffId'] = request.staffId;
		if (request.status) params['CustomerStatus'] = request.status;
		if (request.fromDate) params['FromDate'] = request.fromDate;
		if (request.toDate) params['ToDate'] = request.toDate;

		return this._http.get<AppointmentListResponse>(
			`${environment.apiBaseUrl}/appointments/branches/${request.branchId}`,
			{
				params,
			},
		);
	}
}
