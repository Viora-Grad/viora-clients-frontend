import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ServicesApi } from '../apis/services.api';
import { AddDiscountRequest, CreateServiceRequest, UpdateServiceRequest } from '../dtos/services.dto';
import { Service } from '../models/services.model';

@Injectable({ providedIn: 'root' })
export class ServicesService {
	private readonly _api = inject(ServicesApi);

	public readonly services = signal<Service[]>([]);
	public readonly serviceTypes = signal<string[]>([]);
	public readonly isLoading = signal(false);

	public async loadServices(branchId: string): Promise<void> {
		this.isLoading.set(true);
		try {
			const services = await firstValueFrom(this._api.getServicesByBranch(branchId));
			this.services.set(services);
		} catch {
			this.services.set([]);
		} finally {
			this.isLoading.set(false);
		}
	}

	public async loadServiceTypes(): Promise<void> {
		try {
			const types = await firstValueFrom(this._api.getServiceTypes());
			this.serviceTypes.set(types);
		} catch {
			this.serviceTypes.set([]);
		}
	}

	public async createService(request: CreateServiceRequest): Promise<boolean> {
		try {
			await firstValueFrom(this._api.createService(request));
			await this.loadServices(request.branchId);
			return true;
		} catch {
			return false;
		}
	}

	public async updateService(serviceId: string, request: UpdateServiceRequest, branchId: string): Promise<boolean> {
		try {
			await firstValueFrom(this._api.updateService(serviceId, request));
			await this.loadServices(branchId);
			return true;
		} catch {
			return false;
		}
	}

	public async addDiscount(serviceId: string, request: AddDiscountRequest, branchId: string): Promise<boolean> {
		try {
			await firstValueFrom(this._api.addDiscount(serviceId, request));
			await this.loadServices(branchId);
			return true;
		} catch {
			return false;
		}
	}
}
