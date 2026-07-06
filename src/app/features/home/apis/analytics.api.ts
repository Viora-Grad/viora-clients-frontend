import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
	private readonly _http = inject(HttpClient);

	public getDashboard(from: string, to: string, granularity: string): Observable<string> {
		return this._http.get(`${environment.apiBaseUrl}/analytics/dashboard`, {
			params: { from, to, granularity },
			responseType: 'text',
		});
	}
}
