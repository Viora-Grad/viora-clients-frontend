import { FieldType } from './field-type.enum';

/** Rich read shape — richer than the write DTO. */
export interface RecordFieldValue {
	fieldId: string;
	fieldName: string;
	fieldType: FieldType;
	value: unknown;
}

/** Flattened attachment (wire wraps fileName/blobName/checksum as { value } and contentType as { mediaType }). */
export interface Attachment {
	recordId: string;
	fileName: string;
	blobName: string;
	contentType: string;
	size: number;
	checksum: string;
	uploadedAt: string;
}

export interface ArchiveRecord {
	id: string;
	archiveId: string;
	folderId: string;
	customerId: string;
	appointmentId: string | null;
	templateId: string;
	templateVersionId: string;
	values: RecordFieldValue[];
	attachments: Attachment[];
	createdAt: string;
	updatedAt: string | null;
}
