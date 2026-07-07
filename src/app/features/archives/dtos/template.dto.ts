import { FieldType } from '../models/field-type.enum';
import { FieldLayout, FieldValidation } from '../models/template.model';

export interface CreateTemplateRequest {
	folderId: string;
	name: string;
	description?: string;
}

export interface UpdateTemplateRequest {
	name: string;
	description?: string;
}

/** One field definition (write). validation/layout optional on write. */
export interface TemplateFieldDto {
	name: string;
	label: string;
	type: FieldType;
	required: boolean;
	order: number;
	validation?: FieldValidation | null;
	layout?: FieldLayout | null;
}

export interface CreateTemplateVersionRequest {
	fields: TemplateFieldDto[];
}
