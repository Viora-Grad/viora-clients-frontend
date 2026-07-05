import { Staff } from '../models/staff.model';

export interface StaffApiResponse {
	id: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	gender: string;
	dateOfBirth: string;
	status: string;
}

export interface StaffListResponse {
	items: StaffApiResponse[];
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

export function mapApiResponseToStaff(apiStaff: StaffApiResponse): Staff {
	return {
		id: apiStaff.id,
		firstName: apiStaff.firstName,
		lastName: apiStaff.lastName,
		phoneNumber: apiStaff.phoneNumber,
		gender: apiStaff.gender,
		dateOfBirth: apiStaff.dateOfBirth,
		status: apiStaff.status,
	};
}
