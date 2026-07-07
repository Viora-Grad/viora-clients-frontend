import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ConnectPageRequest {
	pageId: string;
	userToken: string;
}

interface ConnectPageResponse {
	success: boolean;
}

@Injectable({ providedIn: 'root' })
export class FacebookApi {
	private readonly _http = inject(HttpClient);

	public connectPage(request: ConnectPageRequest): Observable<ConnectPageResponse> {
		return this._http.post<ConnectPageResponse>(`${environment.apiBaseUrl}/facebook/connect`, request);
	}
}
