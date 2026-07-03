import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest, LoginResponse } from '../dtos/login.dto';
import { StaffMeResponse, UserMeResponse } from '../dtos/me.dto';

@Injectable({ providedIn: 'root' })
export class AuthApi {
	private readonly _http = inject(HttpClient);

	public login(organizationId: string, request: LoginRequest): Observable<LoginResponse> {
		return this._http.post<LoginResponse>(
			`${environment.apiBaseUrl}/auth/organization/${organizationId}/login`,
			request,
		);
	}

	public refreshToken(refreshToken: string): Observable<LoginResponse> {
		console.log('AuthApi: refreshToken:', refreshToken);
		return this._http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/refresh`, {
			refreshToken,
		});
	}

	public staffRefreshToken(refreshToken: string): Observable<LoginResponse> {
		return this._http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/staff/refresh-token`, {
			refreshToken,
		});
	}

	public getStaffMe(): Observable<StaffMeResponse> {
		return this._http.get<StaffMeResponse>(`${environment.apiBaseUrl}/Staffs/me`);
	}

	public getMe(): Observable<UserMeResponse> {
		return this._http.get<UserMeResponse>(`${environment.apiBaseUrl}/auth/me`);
	}
}
