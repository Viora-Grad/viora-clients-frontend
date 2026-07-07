import { Appointment } from '../models/appointment.model';

export interface AppointmentApiResponse {
	appointmentId: string;
	serviceId: string;
	customerId: string | null;
	staffId: string;
	branchId: string;
	paymentId: string | null;
	reservationDate: string;
	paymentMethod: string | null;
	status: string;
	estimatedDurationMinutes: number | null;
	customerName: string | null;
	serviceName: string | null;
	staffName: string | null;
	cost: string | null;
}

export interface AppointmentDetailResponse {
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

export interface AppointmentListResponse {
	items: AppointmentApiResponse[];
	page: number;
	pageSize: number;
	totalCount: number;
	count: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	nextPage: string | null;
	previousPage: string | null;
}

export interface GetAppointmentsRequest {
	branchId: string;
	serviceId?: string;
	staffId?: string;
	status?: string;
	fromDate?: string;
	toDate?: string;
	page?: number;
	pageSize?: number;
}

export function mapApiResponseToAppointment(apiAppointment: AppointmentApiResponse): Appointment {
	return {
		id: apiAppointment.appointmentId,
		customerName: apiAppointment.customerName ?? 'Unknown',
		serviceName: apiAppointment.serviceName ?? 'Unknown',
		staffName: apiAppointment.staffName ?? 'Unknown',
		startTime: apiAppointment.reservationDate,
		estimatedDurationMinutes: apiAppointment.estimatedDurationMinutes ?? 0,
		status: mapApiStatus(apiAppointment.status),
		notes: undefined,
	};
}

function mapApiStatus(status: string): Appointment['status'] {
	const statusMap: Record<string, Appointment['status']> = {
		Completed: 'completed',
		InProgress: 'InProgress',
		Canceled: 'cancelled',
		NoShow: 'no-show',
		NotArrived: 'NotArrived',
	};
	return statusMap[status] ?? 'NotArrived';
}
