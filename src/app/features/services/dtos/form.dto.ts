import { FormField } from '../models/form.model';

export interface CreateFormRequest {
	staffId: null;
	serviceId: string;
	name: string;
	fields: FormField[] | null;
}
