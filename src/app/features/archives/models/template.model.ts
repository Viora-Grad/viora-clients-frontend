import { FieldType } from './field-type.enum';

export interface FieldValidation {
	required: boolean;
	minLength?: number | null;
	maxLength?: number | null;
	min?: number | null;
	max?: number | null;
	regex?: string | null;
}

export interface FieldLayout {
	column: number;
	order: number;
	tab?: string | null;
	width: number;
}

export interface Template {
	id: string;
	archiveId: string;
	folderId: string;
	name: string;
	description: string;
	currentVersion: number;
	createdAt: string;
}

export interface TemplateVersionField {
	id: string;
	name: string;
	label: string;
	type: FieldType;
	required: boolean;
	order: number;
	validation: FieldValidation;
	layout: FieldLayout;
}

export interface TemplateVersion {
	id: string;
	templateId: string;
	version: number;
	isPublished: boolean;
	fields: TemplateVersionField[];
	createdAt: string;
}
