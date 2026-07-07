export interface PrescriptionTemplateMedia {
	id: string;
	contentType: string;
	fileName: string;
	createdAt: string;
}

export interface PrescriptionTemplate {
	id: string;
	organizationId: string;
	media: PrescriptionTemplateMedia | null;
	name: string;
	topMargin: string;
	rightMargin: string;
	leftMargin: string;
	bottomMargin: string;
	/** Object URL for the template photo blob, resolved lazily after the list loads. */
	imageUrl: string | null;
}
