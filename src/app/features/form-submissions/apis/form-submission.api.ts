import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FormSubmissionResponse } from '../dtos/form-submission.dto';

@Injectable({ providedIn: 'root' })
export class FormSubmissionApi {
	private readonly _http = inject(HttpClient);
	private readonly _baseUrl = environment.apiBaseUrl;

	public getSubmission(
		formId: string,
		appointmentId: string,
	): Observable<FormSubmissionResponse> {
		return this._http.get<FormSubmissionResponse>(
			`${this._baseUrl}/form/${formId}/submission/${appointmentId}`,
		);
	}

	public getFile(submissionId: string, fileId: string): Observable<Blob> {
		return this._http.get(`${this._baseUrl}/form/submission/file/${submissionId}/${fileId}`, {
			responseType: 'blob',
		});
	}
}
