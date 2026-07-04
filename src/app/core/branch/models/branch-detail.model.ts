export interface BranchDetail {
	id: string;
	organizationId: string;
	organizationName: string;
	services: string[];
	address: string;
	location: {
		longitude: string;
		latitude: string;
	};
	branchStatus: number;
	contaceEmail: string;
	phoneNumbers: string[];
	openedSinceUtc: string;
	isCurrentlyOpen: boolean;
}
