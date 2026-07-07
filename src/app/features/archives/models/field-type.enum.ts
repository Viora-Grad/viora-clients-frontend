/** FieldType is sent and received as a NUMBER on the wire. */
export enum FieldType {
	Text = 0,
	Number = 1,
	Date = 2,
	Boolean = 3,
	File = 4,
	Image = 5,
}

export type FolderType = 'Root' | 'System' | 'Normal';
export type TreeNodeType = 'Archive' | 'Folder' | 'Template';

export const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
	{ label: 'Text', value: FieldType.Text },
	{ label: 'Number', value: FieldType.Number },
	{ label: 'Date', value: FieldType.Date },
	{ label: 'Boolean', value: FieldType.Boolean },
	{ label: 'File', value: FieldType.File },
	{ label: 'Image', value: FieldType.Image },
];

export function fieldTypeLabel(type: FieldType): string {
	return FIELD_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Text';
}
