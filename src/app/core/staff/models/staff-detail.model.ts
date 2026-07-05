export interface StaffDetailRolePermission {
	id: string;
	name: string;
	description: string | null;
}

export interface StaffDetailRole {
	id: string;
	name: string;
	description: string | null;
	permissions: StaffDetailRolePermission[];
}

export interface StaffDetailBranchAddress {
	number: string;
	street: string;
	city: string;
	state: string;
	countryId: string;
	postalCode: string;
}

export interface StaffDetailBranchBusinessHours {
	day: string;
	openTime: string;
	closeTime: string;
}

export interface StaffDetailBranch {
	id: string;
	organizationId: string;
	status: string;
	address: StaffDetailBranchAddress;
	contactEmail: string;
	timeZone: string;
	latitude: string;
	longitude: string;
	openedAtUtc: string;
	servicesProvided: string[];
	phoneNumbers: string[];
	businessHours: StaffDetailBranchBusinessHours[];
}

export interface StaffDetailServiceDiscount {
	percentageOutOf100: string;
	reason: string;
	startDateUtc: string;
	endDateUtc: string;
}

export interface StaffDetailService {
	id: string;
	branchId: string;
	name: string;
	description: string;
	type: string;
	status: string;
	durationMinutes: string;
	cost: string;
	currency: string;
	discount: StaffDetailServiceDiscount;
}

export interface StaffDetail {
	id: string;
	organizationId: string;
	firstName: string | null;
	lastName: string | null;
	username: string | null;
	phoneNumber: string | null;
	gender: string | null;
	dateOfBirth: string | null;
	status: string;
	createdAt: string;
	permissions: string[];
	roles: StaffDetailRole[];
	branches: StaffDetailBranch[];
	services: StaffDetailService[];
}
