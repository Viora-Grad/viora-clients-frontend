import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormApi } from '../../services/apis/form.api';
import { ServiceForm } from '../../services/models/form.model';
import { FormSubmissionApi } from '../apis/form-submission.api';
import { AnswersPayload, FormSubmissionResponse } from '../dtos/form-submission.dto';
import { FormSubmission, FormSubmissionAnswer } from '../models/form-submission.model';

@Injectable({ providedIn: 'root' })
export class FormSubmissionService {
	private readonly _api = inject(FormSubmissionApi);
	private readonly _formApi = inject(FormApi);

	/** The form definition for a service, or null when the service has no form. */
	public async getForm(serviceId: string): Promise<ServiceForm | null> {
		try {
			return await firstValueFrom(this._formApi.getFormByServiceId(serviceId));
		} catch {
			return null;
		}
	}

	/** The submission for an appointment, or null when nothing was submitted. */
	public async getSubmission(
		formId: string,
		appointmentId: string,
	): Promise<FormSubmission | null> {
		try {
			const response = await firstValueFrom(this._api.getSubmission(formId, appointmentId));
			return this._mapSubmission(response);
		} catch {
			return null;
		}
	}

	public getFileBlob(submissionId: string, fileId: string): Promise<Blob> {
		return firstValueFrom(this._api.getFile(submissionId, fileId));
	}

	private _mapSubmission(response: FormSubmissionResponse): FormSubmission {
		return {
			id: response.id,
			appointmentId: response.appointmentId,
			formId: response.formId,
			answers: this._parseAnswers(response.answers),
			createdAt: response.createdAt,
			fileList: response.fileList ?? [],
		};
	}

	private _parseAnswers(raw: string | AnswersPayload | null): FormSubmissionAnswer[] {
		if (!raw) return [];
		let payload: AnswersPayload;
		if (typeof raw === 'string') {
			try {
				payload = JSON.parse(raw) as AnswersPayload;
			} catch {
				return [];
			}
		} else {
			payload = raw;
		}
		return Array.isArray(payload.questions) ? payload.questions : [];
	}
}
