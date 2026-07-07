export interface CreateArchiveRequest {
	organizationId: string;
	name: string;
	description?: string;
	enableVersioning: boolean;
	enableAttachments: boolean;
	enableExport: boolean;
	enableAudit: boolean;
}

export interface UpdateArchiveRequest {
	name: string;
	description?: string;
	enableVersioning: boolean;
	enableAttachments: boolean;
	enableExport: boolean;
	enableAudit: boolean;
}
