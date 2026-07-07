import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PrescriptionTemplateApi } from '../apis/prescription-template.api';
import {
	CreatePrescriptionTemplateRequest,
	mapResponseToPrescriptionTemplate,
} from '../dtos/prescription-template.dto';
import { PrescriptionTemplate } from '../models/prescription-template.model';

@Injectable({ providedIn: 'root' })
export class PrescriptionTemplateService {
	private readonly _api = inject(PrescriptionTemplateApi);

	public readonly templates = signal<PrescriptionTemplate[]>([]);
	public readonly isLoading = signal(false);
	public readonly isSaving = signal(false);

	public async loadTemplates(organizationId: string): Promise<void> {
		this.isLoading.set(true);
		this._revokeImageUrls();
		try {
			const response = await firstValueFrom(this._api.getTemplates(organizationId));
			const templates = response.map(mapResponseToPrescriptionTemplate);
			this.templates.set(templates);
			// Chain a file request per template to resolve the preview photo.
			templates.forEach((template) => void this._loadTemplateImage(template.id));
		} catch {
			this.templates.set([]);
		} finally {
			this.isLoading.set(false);
		}
	}

	public async createTemplate(request: CreatePrescriptionTemplateRequest): Promise<boolean> {
		this.isSaving.set(true);
		try {
			await firstValueFrom(this._api.createTemplate(request));
			return true;
		} catch {
			return false;
		} finally {
			this.isSaving.set(false);
		}
	}

	private async _loadTemplateImage(templateId: string): Promise<void> {
		try {
			const blob = await firstValueFrom(this._api.getTemplateFile(templateId));
			const imageUrl = URL.createObjectURL(blob);
			this.templates.update((templates) =>
				templates.map((template) =>
					template.id === templateId ? { ...template, imageUrl } : template,
				),
			);
		} catch {
			// leave imageUrl null so the card renders its placeholder
		}
	}

	private _revokeImageUrls(): void {
		this.templates().forEach((template) => {
			if (template.imageUrl) URL.revokeObjectURL(template.imageUrl);
		});
	}
}
