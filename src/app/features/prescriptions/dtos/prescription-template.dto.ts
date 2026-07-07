import { PrescriptionTemplate } from '../models/prescription-template.model';

export interface PrescriptionTemplateMediaResponse {
	id: string;
	contentType: string;
	fileName: string;
	createdAt: string;
}

export interface PrescriptionTemplateResponse {
	id: string;
	organizaionId: string;
	media: PrescriptionTemplateMediaResponse | null;
	name: string;
	topMargin: string;
	rightMargin: string;
	leftMargin: string;
	bottomMargin: string;
}

export interface CreatePrescriptionTemplateRequest {
	organizationId: string;
	name: string;
	file: File;
	topMargin: string;
	rightMargin: string;
	leftMargin: string;
	bottomMargin: string;
}

export function mapResponseToPrescriptionTemplate(
	response: PrescriptionTemplateResponse,
): PrescriptionTemplate {
	return {
		id: response.id,
		// NOTE: the API spells this "organizaionId" (sic); normalize it here.
		organizationId: response.organizaionId,
		media: response.media,
		name: response.name,
		topMargin: response.topMargin,
		rightMargin: response.rightMargin,
		leftMargin: response.leftMargin,
		bottomMargin: response.bottomMargin,
		imageUrl: null,
	};
}
