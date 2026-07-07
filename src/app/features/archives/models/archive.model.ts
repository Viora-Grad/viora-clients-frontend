export interface ArchiveSettings {
	enableVersioning: boolean;
	enableAttachments: boolean;
	enableExport: boolean;
	enableAudit: boolean;
}

export interface Archive {
	id: string;
	organizationId: string;
	name: string;
	description: string;
	/** ⚠ named "rootFolder" on the wire and it is the root folder's Guid. */
	rootFolder: string;
	settings: ArchiveSettings;
	createdAt: string;
}
