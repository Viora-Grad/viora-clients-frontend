import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ArchiveApi } from '../apis/archive.api';
import {
	CreateRecordRequest,
	mapResponseToRecord,
	SearchRecordsParams,
	UpdateRecordRequest,
} from '../dtos/record.dto';
import { ArchiveRecord } from '../models/record.model';

@Injectable({ providedIn: 'root' })
export class RecordService {
	private readonly _api = inject(ArchiveApi);

	public readonly records = signal<ArchiveRecord[]>([]);
	public readonly isLoading = signal(false);
	public readonly isSaving = signal(false);

	public async loadRecordsByFolder(archiveId: string, folderId: string): Promise<void> {
		this.isLoading.set(true);
		try {
			const response = await firstValueFrom(this._api.getRecordsByFolder(archiveId, folderId));
			this.records.set(response.map(mapResponseToRecord));
		} catch {
			this.records.set([]);
		} finally {
			this.isLoading.set(false);
		}
	}

	public async searchRecords(archiveId: string, params: SearchRecordsParams): Promise<void> {
		this.isLoading.set(true);
		try {
			const response = await firstValueFrom(this._api.searchRecords(archiveId, params));
			this.records.set(response.map(mapResponseToRecord));
		} catch {
			this.records.set([]);
		} finally {
			this.isLoading.set(false);
		}
	}

	public async getRecord(archiveId: string, id: string): Promise<ArchiveRecord> {
		const response = await firstValueFrom(this._api.getRecord(archiveId, id));
		return mapResponseToRecord(response);
	}

	public async createRecord(
		archiveId: string,
		request: CreateRecordRequest,
	): Promise<ArchiveRecord | null> {
		this.isSaving.set(true);
		try {
			const response = await firstValueFrom(this._api.createRecord(archiveId, request));
			return mapResponseToRecord(response);
		} catch {
			return null;
		} finally {
			this.isSaving.set(false);
		}
	}

	public async updateRecord(
		archiveId: string,
		id: string,
		request: UpdateRecordRequest,
	): Promise<boolean> {
		this.isSaving.set(true);
		try {
			await firstValueFrom(this._api.updateRecord(archiveId, id, request));
			return true;
		} catch {
			return false;
		} finally {
			this.isSaving.set(false);
		}
	}

	public async deleteRecord(archiveId: string, id: string): Promise<boolean> {
		try {
			await firstValueFrom(this._api.deleteRecord(archiveId, id));
			return true;
		} catch {
			return false;
		}
	}
}
