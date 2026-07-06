import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppointmentApi } from '../apis/appointment.api';
import { GetAppointmentsRequest, mapApiResponseToAppointment } from '../dtos/appointment.dto';
import { Appointment } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
	private readonly _api = inject(AppointmentApi);

	public readonly appointments = signal<Appointment[]>([]);
	public readonly isLoading = signal(false);
	public readonly currentPage = signal(1);
	public readonly pageSize = signal(10);
	public readonly totalCount = signal(0);
	public readonly totalPages = signal(0);
	public readonly hasNextPage = signal(false);
	public readonly hasPreviousPage = signal(false);

	public async loadAppointments(request: GetAppointmentsRequest): Promise<void> {
		this.isLoading.set(true);
		try {
			const response = await firstValueFrom(this._api.getAppointments(request));
			const appointments = response.items.map(mapApiResponseToAppointment);
			this.appointments.set(appointments);
			this.currentPage.set(Number(response.page));
			this.pageSize.set(Number(response.pageSize));
			this.totalCount.set(Number(response.totalCount));
			this.totalPages.set(Number(response.totalPages));
			this.hasNextPage.set(response.hasNextPage);
			this.hasPreviousPage.set(response.hasPreviousPage);
		} catch {
			this.appointments.set([]);
		} finally {
			this.isLoading.set(false);
		}
	}
}
