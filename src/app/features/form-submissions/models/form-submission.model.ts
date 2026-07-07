export interface SubmissionFile {
	id: string;
	contentType: string;
	fileName: string;
	createdAt: string;
}

export interface FormSubmissionAnswer {
	id: string;
	type: string;
	answer: string | null;
}

export interface FormSubmission {
	id: string;
	appointmentId: string;
	formId: string;
	answers: FormSubmissionAnswer[];
	createdAt: string;
	fileList: SubmissionFile[];
}
