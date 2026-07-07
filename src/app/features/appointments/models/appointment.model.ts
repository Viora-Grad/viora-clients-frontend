export interface Appointment {
	id: string;
	customerName: string;
	serviceName: string;
	staffName: string;
	startTime: string;
	estimatedDurationMinutes: number;
	status: AppointmentStatus;
	notes?: string;
}

export interface AppointmentDetail {
	appointmentId: string;
	serviceId: string;
	customerId: string | null;
	staffId: string;
	branchId: string;
	paymentId: string | null;
	reservationDate: string;
	paymentMethod: string | null;
	isCheckedIn: boolean;
	status: string;
	estimatedDurationMinutes: string | null;
	appointmentQueueNumber: string | null;
	endTime: string | null;
	createdAt: string | null;
	customerFirstName: string | null;
	customerLastName: string | null;
	serviceName: string | null;
	cost: string | null;
	staffFirstName: string | null;
	staffLastName: string | null;
	staffPhoneNumber: string | null;
	address: string | null;
}

export type AppointmentStatus =
	| 'NotArrived'
	| 'confirmed'
	| 'InProgress'
	| 'completed'
	| 'cancelled'
	| 'no-show';

export interface TodayShift {
	id: string;
	staffId: string;
	staffName: string;
	staffInitials: string;
	serviceName: string;
	startTime: string;
	endTime: string;
	rawStartTime: string;
	rawEndTime: string;
}
