import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Organization } from './dtos/organization.dto';
import { UpdateOrganizationRequest } from './dtos/update-organization-profile-request.dto';

@Injectable({ providedIn: 'root' })
export class OrganizationProfileApi {
	private readonly _http = inject(HttpClient);
	private readonly _baseUrl = environment.apiBaseUrl;

	public getOrganization(id: string): Observable<Organization> {
		return this._http.get<Organization>(`${this._baseUrl}/Organizations/${id}`);
	}

	public getOrganizationBySubdomain(subdomain: string): Observable<Organization> {
		return this._http.get<Organization>(`${this._baseUrl}/Organizations/subdomain/${subdomain}`,);
	}

	public updateOrganization(id: string, request: UpdateOrganizationRequest): Observable<void> {
		return this._http.put<void>(`${this._baseUrl}/Organizations/${id}/profile`, request);
	}

	public getLogo(id: string): Observable<Blob> {
	return this._http.get(`${this._baseUrl}/Organizations/${id}/logo`,{responseType: 'blob'});}

	public uploadLogo(id: string, file: File): Observable<void> {
		const formData = new FormData();
		formData.append('file', file);
		return this._http.put<void>(`${this._baseUrl}/Organizations/${id}/logo`, formData);
	}


	public checkSubDomainExists(name: string): Observable<boolean> {
		return this._http.get<boolean>(`${this._baseUrl}/Organizations/exists`, {
			params: { Name: name },
		});
	}

	public getservicesProvided(): Observable<string[]> {
		return this._http.get<string[]>(`${this._baseUrl}/ServiceTypes`,);
	}
}
