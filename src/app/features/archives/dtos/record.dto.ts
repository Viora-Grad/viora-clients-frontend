import { ArchiveRecord, Attachment, RecordFieldValue } from '../models/record.model';

/** Lean write shape. */
export interface RecordFieldValueDto {
	fieldName: string;
	value: unknown;
}

export interface CreateRecordRequest {
	folderId: string;
	customerId: string;
	appointmentId: string | null;
	templateId: string;
	/** integer version number, NOT the version Guid */
	templateVersion: number;
	values: RecordFieldValueDto[];
}

export interface UpdateRecordRequest {
	values: RecordFieldValueDto[];
}

export interface SearchRecordsParams {
	searchTerm?: string;
	folderId?: string;
	fromDate?: string;
	toDate?: string;
}

// ---- raw response shapes (value-object wrappers still wrapped) ----
interface AttachmentResponse {
	recordId: string;
	fileName: { value: string };
	blobName: { value: string };
	contentType: { mediaType: string; boundary?: string; charSet?: string; name?: string };
	size: number;
	checksum: { value: string };
	uploadedAt: string;
}

export interface RecordResponse {
	id: string;
	archiveId: string;
	folderId: string;
	customerId: string;
	appointmentId: string | null;
	templateId: string;
	templateVersionId: string;
	values: RecordFieldValue[] | null;
	attachments: AttachmentResponse[] | null;
	createdAt: string;
	updatedAt: string | null;
}

function mapAttachment(raw: AttachmentResponse): Attachment {
	return {
		recordId: raw.recordId,
		fileName: raw.fileName?.value ?? '',
		blobName: raw.blobName?.value ?? '',
		contentType: raw.contentType?.mediaType ?? '',
		size: raw.size,
		checksum: raw.checksum?.value ?? '',
		uploadedAt: raw.uploadedAt,
	};
}

export function mapResponseToRecord(response: RecordResponse): ArchiveRecord {
	return {
		id: response.id,
		archiveId: response.archiveId,
		folderId: response.folderId,
		customerId: response.customerId,
		appointmentId: response.appointmentId,
		templateId: response.templateId,
		templateVersionId: response.templateVersionId,
		values: response.values ?? [],
		attachments: (response.attachments ?? []).map(mapAttachment),
		createdAt: response.createdAt,
		updatedAt: response.updatedAt,
	};
}
