import { PrescriptionItem } from '../models/prescription.model';

export interface PrescriptionItemDto {
	name: string;
	note: string | null;
	dose: string;
	frequence: string;
	duration: string;
}

export interface PrescriptionResponse {
	id: string;
	appointmentId: string;
	createAt: string;
	items: PrescriptionItemDto[];
}

export interface CreatePrescriptionRequest {
	appointmentId: string;
	items: PrescriptionItem[];
}
