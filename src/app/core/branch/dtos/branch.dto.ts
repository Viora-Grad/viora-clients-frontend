import { StaffBranch } from '../../auth/dtos/me.dto';
import { Branch } from '../models/branch.model';

export interface BranchApiResponse {
	branchId: string;
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

export interface BranchListResponse {
	items: BranchApiResponse[];
	page: string;
	pageSize: string;
	totalCount: string;
	count: string;
	totalPages: string;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	nextPage: string | null;
	previousPage: string | null;
}

export function mapApiResponseToBranch(apiBranch: BranchApiResponse): Branch {
	return {
		id: apiBranch.branchId,
		organizationId: apiBranch.organizationId,
		organizationName: apiBranch.organizationName,
		isOpen: apiBranch.isOpen,
		openedSince: apiBranch.openedSince,
		rating: apiBranch.rating,
		status: apiBranch.status,
		address: apiBranch.address,
		coverImage: apiBranch.coverImage,
		timeLineId: apiBranch.timeLineId,
		coordinates: apiBranch.coordinates,
	};
}

export function mapStaffBranchToBranch(staffBranch: StaffBranch): Branch {
	const addr = staffBranch.address;
	const address = `${addr.number} ${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}`.trim();

	return {
		id: staffBranch.id,
		organizationId: staffBranch.organizationId,
		organizationName: '',
		isOpen: true,
		openedSince: staffBranch.openedAtUtc,
		rating: '',
		status: 1,
		address,
		coverImage: null,
		timeLineId: '',
		coordinates: {
			longitude: staffBranch.longitude,
			latitude: staffBranch.latitude,
		},
	};
}
