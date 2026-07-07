import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormApi } from '../apis/form.api';
import { CreateFormRequest } from '../dtos/form.dto';
import { FormField, ServiceForm } from '../models/form.model';

@Injectable({ providedIn: 'root' })
export class FormService {
	private readonly _api = inject(FormApi);

	public readonly currentForm = signal<ServiceForm | null>(null);
	public readonly isLoading = signal(false);

	public async loadForm(serviceId: string): Promise<boolean> {
		this.isLoading.set(true);
		try {
			const form = await firstValueFrom(this._api.getFormByServiceId(serviceId));
			this.currentForm.set(form);
			return true;
		} catch {
			this.currentForm.set(null);
			return false;
		} finally {
			this.isLoading.set(false);
		}
	}

	public async createForm(serviceId: string, name: string, fields: FormField[] | null): Promise<boolean> {
		try {
			const request: CreateFormRequest = {
				staffId: null,
				serviceId,
				name,
				fields,
			};
			const form = await firstValueFrom(this._api.createForm(request));
			this.currentForm.set(form);
			return true;
		} catch {
			return false;
		}
	}

	public async updateForm(formId: string, fields: FormField[]): Promise<boolean> {
		try {
			const form = await firstValueFrom(this._api.updateForm(formId, fields));
			this.currentForm.set(form);
			return true;
		} catch {
			return false;
		}
	}

	public async deleteForm(formId: string): Promise<boolean> {
		try {
			await firstValueFrom(this._api.deleteForm(formId));
			this.currentForm.set(null);
			return true;
		} catch {
			return false;
		}
	}
}
