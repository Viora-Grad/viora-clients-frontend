export interface AuthDetails {
	id: string;
	isStaff: boolean;
	permissions: string[];
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	dateOfBirth?: string | null;
	gender?: string | null;
}
