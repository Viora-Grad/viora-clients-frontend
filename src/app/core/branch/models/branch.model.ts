export interface Branch {
	id: string;
	organizationId: string;
	organizationName: string;
	isOpen: boolean;
	openedSince: string;
	rating: string;
	status: number;
	address: string;
	coverImage: {
		id: string;
		contentType: string;
		fileName: string;
		createdAt: string;
	} | null;
	timeLineId: string;
	coordinates: {
		longitude: string;
		latitude: string;
	};
}
