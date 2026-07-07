export interface PrescriptionItem {
	name: string;
	note: string | null;
	dose: string;
	frequence: string;
	duration: string;
}

export interface Prescription {
	id: string;
	appointmentId: string;
	createAt: string;
	items: PrescriptionItem[];
}
