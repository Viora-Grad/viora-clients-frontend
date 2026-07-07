import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ArchiveApi } from '../apis/archive.api';
import {
	CreateTemplateRequest,
	CreateTemplateVersionRequest,
	UpdateTemplateRequest,
} from '../dtos/template.dto';
import { Template, TemplateVersion } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
	private readonly _api = inject(ArchiveApi);

	public readonly templates = signal<Template[]>([]);
	public readonly isLoading = signal(false);
	public readonly isSaving = signal(false);

	public async loadTemplatesByFolder(archiveId: string, folderId: string): Promise<void> {
		this.isLoading.set(true);
		try {
			const templates = await firstValueFrom(this._api.getTemplatesByFolder(archiveId, folderId));
			this.templates.set(templates);
		} catch {
			this.templates.set([]);
		} finally {
			this.isLoading.set(false);
		}
	}

	public getTemplate(archiveId: string, id: string): Promise<Template> {
		return firstValueFrom(this._api.getTemplate(archiveId, id));
	}

	public getCurrentVersion(archiveId: string, templateId: string): Promise<TemplateVersion> {
		return firstValueFrom(this._api.getTemplateCurrentVersion(archiveId, templateId));
	}

	public getVersion(
		archiveId: string,
		templateId: string,
		version: number,
	): Promise<TemplateVersion> {
		return firstValueFrom(this._api.getTemplateVersion(archiveId, templateId, version));
	}

	public async createTemplate(
		archiveId: string,
		request: CreateTemplateRequest,
	): Promise<Template | null> {
		this.isSaving.set(true);
		try {
			return await firstValueFrom(this._api.createTemplate(archiveId, request));
		} catch {
			return null;
		} finally {
			this.isSaving.set(false);
		}
	}

	public async updateTemplate(
		archiveId: string,
		id: string,
		request: UpdateTemplateRequest,
	): Promise<boolean> {
		this.isSaving.set(true);
		try {
			await firstValueFrom(this._api.updateTemplate(archiveId, id, request));
			return true;
		} catch {
			return false;
		} finally {
			this.isSaving.set(false);
		}
	}

	public async deleteTemplate(archiveId: string, id: string): Promise<boolean> {
		try {
			await firstValueFrom(this._api.deleteTemplate(archiveId, id));
			return true;
		} catch {
			return false;
		}
	}

	/** Create a version's field set (unpublished), then publish it. */
	public async createVersion(
		archiveId: string,
		templateId: string,
		request: CreateTemplateVersionRequest,
	): Promise<TemplateVersion | null> {
		this.isSaving.set(true);
		try {
			return await firstValueFrom(this._api.createTemplateVersion(archiveId, templateId, request));
		} catch {
			return null;
		} finally {
			this.isSaving.set(false);
		}
	}

	public async publishVersion(
		archiveId: string,
		templateId: string,
		versionId: string,
	): Promise<boolean> {
		try {
			await firstValueFrom(this._api.publishTemplateVersion(archiveId, templateId, versionId));
			return true;
		} catch {
			return false;
		}
	}
}
