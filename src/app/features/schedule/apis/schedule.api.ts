import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map as rxjsMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
	CancelShiftRequest,
	CreateScheduleRequest,
	CreateShiftRequest,
	ScheduleApiResponse,
} from '../dtos/schedule.dto';
import { Schedule, StaffOption } from '../models/schedule.model';
import { StaffApiResponse } from '../../../core/staff/dtos/staff.dto';

@Injectable({ providedIn: 'root' })
export class ScheduleApi {
	private readonly _http = inject(HttpClient);

	public getSchedules(branchId: string): Observable<Schedule[]> {
		return this._http
			.get<ScheduleApiResponse[]>(`${environment.apiBaseUrl}/schedule/${branchId}`)
			.pipe(rxjsMap((response) => response.map((s) => ({ day: s.day, shifts: s.shifts }))));
	}

	public createSchedule(request: CreateScheduleRequest): Observable<unknown> {
		return this._http.post(`${environment.apiBaseUrl}/schedule/create`, request);
	}

	public createShift(request: CreateShiftRequest): Observable<unknown> {
		return this._http.post(`${environment.apiBaseUrl}/schedule/shift/create`, request);
	}

	public cancelShift(request: CancelShiftRequest): Observable<unknown> {
		return this._http.post(`${environment.apiBaseUrl}/schedule/cancel`, request);
	}

	public deleteShift(shiftId: string): Observable<unknown> {
		return this._http.delete(`${environment.apiBaseUrl}/schedule/shift/delete/${shiftId}`);
	}

	public getStaff(organizationId: string): Observable<StaffOption[]> {
		return this._http
			.get<{ items: StaffApiResponse[] }>(`${environment.apiBaseUrl}/Staffs`, {
				params: { organizationId, page: '1', pageSize: '100' },
			})
			.pipe(
				rxjsMap((response) =>
					response.items.map((s) => ({
						id: s.id,
						firstName: s.firstName,
						lastName: s.lastName,
					})),
				),
			);
	}
}
