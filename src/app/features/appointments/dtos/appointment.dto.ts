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
	estimatedDurationMinutes: string | null;
	customerName: string | null;
	serviceName: string | null;
	staffName: string | null;
	cost: string | null;
}

export interface AppointmentListResponse {
	items: AppointmentApiResponse[];
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
		endTime: apiAppointment.reservationDate,
		status: mapApiStatus(apiAppointment.status),
		notes: undefined,
	};
}

function mapApiStatus(status: string): Appointment['status'] {
	const statusMap: Record<string, Appointment['status']> = {
		'Completed': 'completed',
		'InProgress': 'in-progress',
		'Canceled': 'cancelled',
		'NoShow': 'no-show',
		'NotArrived': 'scheduled',
	};
	return statusMap[status] ?? 'scheduled';
}
