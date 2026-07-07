import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ArchiveApi } from '../apis/archive.api';
import { CreateArchiveRequest, UpdateArchiveRequest } from '../dtos/archive.dto';
import { Archive } from '../models/archive.model';

@Injectable({ providedIn: 'root' })
export class ArchiveService {
	private readonly _api = inject(ArchiveApi);

	public readonly archives = signal<Archive[]>([]);
	public readonly isLoading = signal(false);
	public readonly isSaving = signal(false);

	public async loadArchives(organizationId: string): Promise<void> {
		this.isLoading.set(true);
		try {
			const archives = await firstValueFrom(this._api.getArchivesByOrg(organizationId));
			this.archives.set(archives);
		} catch {
			this.archives.set([]);
		} finally {
			this.isLoading.set(false);
		}
	}

	public async createArchive(request: CreateArchiveRequest): Promise<Archive | null> {
		this.isSaving.set(true);
		try {
			return await firstValueFrom(this._api.createArchive(request));
		} catch {
			return null;
		} finally {
			this.isSaving.set(false);
		}
	}

	public async updateArchive(id: string, request: UpdateArchiveRequest): Promise<boolean> {
		this.isSaving.set(true);
		try {
			await firstValueFrom(this._api.updateArchive(id, request));
			return true;
		} catch {
			return false;
		} finally {
			this.isSaving.set(false);
		}
	}

	public async deleteArchive(id: string): Promise<boolean> {
		try {
			await firstValueFrom(this._api.deleteArchive(id));
			return true;
		} catch {
			return false;
		}
	}

	public getArchive(id: string): Promise<Archive> {
		return firstValueFrom(this._api.getArchive(id));
	}
}
