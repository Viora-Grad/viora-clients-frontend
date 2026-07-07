import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
	CreatePrescriptionTemplateRequest,
	PrescriptionTemplateResponse,
} from '../dtos/prescription-template.dto';

@Injectable({ providedIn: 'root' })
export class PrescriptionTemplateApi {
	private readonly _http = inject(HttpClient);
	private readonly _baseUrl = environment.apiBaseUrl;

	public getTemplates(organizationId: string): Observable<PrescriptionTemplateResponse[]> {
		return this._http.get<PrescriptionTemplateResponse[]>(
			`${this._baseUrl}/${organizationId}/prescription-template`,
		);
	}

	public getTemplateFile(templateId: string): Observable<Blob> {
		return this._http.get(`${this._baseUrl}/prescription-template/${templateId}/File`, {
			responseType: 'blob',
		});
	}

	public createTemplate(request: CreatePrescriptionTemplateRequest): Observable<void> {
		const formData = new FormData();
		formData.append('OrganizationId', request.organizationId);
		formData.append('Name', request.name);
		formData.append('File', request.file, request.file.name);
		formData.append('TopMargin', request.topMargin);
		formData.append('RightMargin', request.rightMargin);
		formData.append('LeftMargin', request.leftMargin);
		formData.append('BottomMargin', request.bottomMargin);

		return this._http.post<void>(`${this._baseUrl}/prescription-template/create`, formData);
	}
}
