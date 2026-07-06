import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AddDiscountRequest, CreateServiceRequest, UpdateServiceRequest } from '../dtos/services.dto';
import { Service } from '../models/services.model';

@Injectable({ providedIn: 'root' })
export class ServicesApi {
	private readonly _http = inject(HttpClient);

	public getServicesByBranch(branchId: string): Observable<Service[]> {
		return this._http.get<Service[]>(`${environment.apiBaseUrl}/branch/${branchId}/services`);
	}

	public getServiceTypes(): Observable<string[]> {
		return this._http.get<string[]>(`${environment.apiBaseUrl}/ServiceTypes`);
	}

	public createService(request: CreateServiceRequest): Observable<Service> {
		return this._http.post<Service>(`${environment.apiBaseUrl}/services`, request);
	}

	public updateService(serviceId: string, request: UpdateServiceRequest): Observable<Service> {
		return this._http.put<Service>(`${environment.apiBaseUrl}/services/${serviceId}`, request);
	}

	public addDiscount(serviceId: string, request: AddDiscountRequest): Observable<Service> {
		return this._http.post<Service>(`${environment.apiBaseUrl}/services/${serviceId}/discount`, request);
	}
}
