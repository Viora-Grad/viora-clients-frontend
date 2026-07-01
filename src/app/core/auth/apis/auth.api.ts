import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest, LoginResponse } from '../dtos/login.dto';

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
		return this._http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken });
	}
}
