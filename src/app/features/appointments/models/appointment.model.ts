export interface Appointment {
	id: string;
	customerName: string;
	serviceName: string;
	staffName: string;
	startTime: string;
	endTime: string;
	status: AppointmentStatus;
	notes?: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';

export interface TodayShift {
	id: string;
	staffName: string;
	staffInitials: string;
	serviceName: string;
	startTime: string;
	endTime: string;
}
