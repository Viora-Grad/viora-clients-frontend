import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RegisterStaffRequest {
	token: string;
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	gender: string;
	phoneNumber: string;
	username: string;
	password: string;
}

@Injectable({ providedIn: 'root' })
export class RegisterStaffApi {
	private readonly _http = inject(HttpClient);

	public register(organizationId: string, request: RegisterStaffRequest): Observable<unknown> {
		return this._http.post(
			`${environment.apiBaseUrl}/auth/organization/${organizationId}/staff/register`,
			request,
		);
	}

	public validateUsername(organizationId: string, value: string): Observable<boolean> {
		return this._http.post(
			`${environment.apiBaseUrl}/auth/organization/${organizationId}/validate-username`,
			{ value },
		).pipe(
			map(() => true),
			catchError((error: HttpErrorResponse) => {
				if (error.status === 409) {
					return of(false);
				}
				return of(true);
			}),
		);
	}
}
