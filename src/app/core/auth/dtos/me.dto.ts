interface StaffRolePermission {
	id: string;
	name: string;
	description: string | null;
}

interface StaffRole {
	id: string;
	name: string;
	description: string | null;
	permissions: StaffRolePermission[];
}

interface StaffBranchAddress {
	number: string;
	street: string;
	city: string;
	state: string;
	countryId: string;
	postalCode: string;
}

interface StaffBranchBusinessHours {
	day: string;
	openTime: string;
	closeTime: string;
}

export interface StaffBranch {
	id: string;
	organizationId: string;
	status: string;
	address: StaffBranchAddress;
	contactEmail: string;
	timeZone: string;
	latitude: string;
	longitude: string;
	openedAtUtc: string;
	servicesProvided: string[];
	phoneNumbers: string[];
	businessHours: StaffBranchBusinessHours[];
}

interface StaffServiceDiscount {
	percentageOutOf100: string;
	reason: string;
	startDateUtc: string;
	endDateUtc: string;
}

interface StaffService {
	id: string;
	branchId: string;
	name: string;
	description: string;
	type: string;
	status: string;
	durationMinutes: string;
	cost: string;
	currency: string;
	discount: StaffServiceDiscount;
}

export interface StaffMeResponse {
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
	roles: StaffRole[];
	branches: StaffBranch[];
	services: StaffService[];
}

export interface UserMeResponse {
	firstName: string;
	lastName: string;
	email: string;
	dateOfBirth: string;
	gender: string;
}
