import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreatePrescriptionRequest, PrescriptionResponse } from '../dtos/prescription.dto';

@Injectable({ providedIn: 'root' })
export class PrescriptionApi {
	private readonly _http = inject(HttpClient);
	private readonly _baseUrl = environment.apiBaseUrl;

	public getByAppointment(appointmentId: string): Observable<PrescriptionResponse> {
		return this._http.get<PrescriptionResponse>(
			`${this._baseUrl}/prescription/appointment/${appointmentId}`,
		);
	}

	public createPrescription(request: CreatePrescriptionRequest): Observable<PrescriptionResponse> {
		return this._http.post<PrescriptionResponse>(
			`${this._baseUrl}/prescription/create`,
			request,
		);
	}
}
