import { Schedule } from '../models/schedule.model';

export interface ScheduleApiResponse {
	day: string;
	shifts: {
		shiftId: string;
		staffId: string;
		startTime: string;
		endTime: string;
	}[];
}

export interface CreateScheduleRequest {
	branchId: string;
	dayOfWeek: string;
}

export interface CreateShiftRequest {
	branchId: string;
	startTime: string;
	endTime: string;
	staffId: string;
	dayOfWeek: string;
}

export interface CancelShiftRequest {
	shiftId: string;
	branchId: string;
	cancellationDate: string;
	reason: string;
}

export function mapApiResponseToSchedule(apiSchedule: ScheduleApiResponse): Schedule {
	return {
		day: apiSchedule.day,
		shifts: apiSchedule.shifts.map((s) => ({
			shiftId: s.shiftId,
			staffId: s.staffId,
			startTime: s.startTime,
			endTime: s.endTime,
		})),
	};
}
