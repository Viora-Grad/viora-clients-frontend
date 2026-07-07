import { FormSubmissionAnswer, SubmissionFile } from '../models/form-submission.model';

/** The `answers` payload is a JSON string (or already-parsed object) of this shape. */
export interface AnswersPayload {
	questions?: FormSubmissionAnswer[];
}

export interface FormSubmissionResponse {
	id: string;
	appointmentId: string;
	formId: string;
	answers: string | AnswersPayload | null;
	createdAt: string;
	fileList: SubmissionFile[] | null;
}
