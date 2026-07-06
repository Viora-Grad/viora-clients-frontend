export interface Schedule {
	day: string;
	shifts: Shift[];
}

export interface Shift {
	staffId: string;
	startTime: string;
	endTime: string;
}

export interface StaffOption {
	id: string;
	firstName: string;
	lastName: string;
}
