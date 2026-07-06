export interface FormField {
	name: string;
	type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'file';
	label: string;
	required: boolean;
	options?: string[];
	accept?: string[];
}

export interface ServiceForm {
	id: string;
	staffId: string;
	serviceId: string;
	name: string;
	fields: FormField[] | null;
}
