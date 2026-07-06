import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateFormRequest } from '../dtos/form.dto';
import { FormField, ServiceForm } from '../models/form.model';

@Injectable({ providedIn: 'root' })
export class FormApi {
	private readonly _http = inject(HttpClient);

	public getFormByServiceId(serviceId: string): Observable<ServiceForm> {
		return this._http.get<ServiceForm>(`${environment.apiBaseUrl}/service/${serviceId}/form`);
	}

	public createForm(request: CreateFormRequest): Observable<ServiceForm> {
		return this._http.post<ServiceForm>(`${environment.apiBaseUrl}/service/form/create`, request);
	}

	public updateForm(formId: string, fields: FormField[]): Observable<ServiceForm> {
		return this._http.put<ServiceForm>(`${environment.apiBaseUrl}/service/form/update/${formId}`, fields);
	}

	public deleteForm(formId: string): Observable<void> {
		return this._http.delete<void>(`${environment.apiBaseUrl}/service/form/delete/${formId}`);
	}
}
