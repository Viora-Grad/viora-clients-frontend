import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateArchiveRequest, UpdateArchiveRequest } from '../dtos/archive.dto';
import { CreateFolderRequest, UpdateFolderRequest } from '../dtos/folder.dto';
import {
	CreateRecordRequest,
	RecordResponse,
	SearchRecordsParams,
	UpdateRecordRequest,
} from '../dtos/record.dto';
import {
	CreateTemplateRequest,
	CreateTemplateVersionRequest,
	UpdateTemplateRequest,
} from '../dtos/template.dto';
import { Archive } from '../models/archive.model';
import { ArchiveTreeNode, Folder } from '../models/folder.model';
import { Template, TemplateVersion } from '../models/template.model';

@Injectable({ providedIn: 'root' })
export class ArchiveApi {
	private readonly _http = inject(HttpClient);
	// NOTE: backend documents these under `api/archives`; this project drops the
	// `/api` segment on every resource. Flip `_baseUrl` if archives 404.
	private readonly _baseUrl = `${environment.apiBaseUrl}/archives`;

	// ---- Archives ----
	public createArchive(body: CreateArchiveRequest): Observable<Archive> {
		return this._http.post<Archive>(this._baseUrl, body);
	}

	public getArchivesByOrg(organizationId: string): Observable<Archive[]> {
		return this._http.get<Archive[]>(`${this._baseUrl}/organization/${organizationId}`);
	}

	public getArchive(id: string): Observable<Archive> {
		return this._http.get<Archive>(`${this._baseUrl}/${id}`);
	}

	public updateArchive(id: string, body: UpdateArchiveRequest): Observable<void> {
		return this._http.put<void>(`${this._baseUrl}/${id}`, body);
	}

	public deleteArchive(id: string): Observable<void> {
		return this._http.delete<void>(`${this._baseUrl}/${id}`);
	}

	// ---- Folders ----
	public getFolderTree(archiveId: string): Observable<ArchiveTreeNode> {
		return this._http.get<ArchiveTreeNode>(`${this._baseUrl}/${archiveId}/tree`);
	}

	public createFolder(archiveId: string, body: CreateFolderRequest): Observable<Folder> {
		return this._http.post<Folder>(`${this._baseUrl}/${archiveId}/folders`, body);
	}

	public getFolder(archiveId: string, id: string): Observable<Folder> {
		return this._http.get<Folder>(`${this._baseUrl}/${archiveId}/folders/${id}`);
	}

	public updateFolder(archiveId: string, id: string, body: UpdateFolderRequest): Observable<void> {
		return this._http.put<void>(`${this._baseUrl}/${archiveId}/folders/${id}`, body);
	}

	public deleteFolder(archiveId: string, id: string): Observable<void> {
		return this._http.delete<void>(`${this._baseUrl}/${archiveId}/folders/${id}`);
	}

	// ---- Templates & versions ----
	public createTemplate(archiveId: string, body: CreateTemplateRequest): Observable<Template> {
		return this._http.post<Template>(`${this._baseUrl}/${archiveId}/templates`, body);
	}

	public getTemplatesByFolder(archiveId: string, folderId: string): Observable<Template[]> {
		return this._http.get<Template[]>(
			`${this._baseUrl}/${archiveId}/folders/${folderId}/templates`,
		);
	}

	public getTemplate(archiveId: string, id: string): Observable<Template> {
		return this._http.get<Template>(`${this._baseUrl}/${archiveId}/templates/${id}`);
	}

	public updateTemplate(
		archiveId: string,
		id: string,
		body: UpdateTemplateRequest,
	): Observable<void> {
		return this._http.put<void>(`${this._baseUrl}/${archiveId}/templates/${id}`, body);
	}

	public deleteTemplate(archiveId: string, id: string): Observable<void> {
		return this._http.delete<void>(`${this._baseUrl}/${archiveId}/templates/${id}`);
	}

	public createTemplateVersion(
		archiveId: string,
		templateId: string,
		body: CreateTemplateVersionRequest,
	): Observable<TemplateVersion> {
		return this._http.post<TemplateVersion>(
			`${this._baseUrl}/${archiveId}/templates/${templateId}/versions`,
			body,
		);
	}

	public publishTemplateVersion(
		archiveId: string,
		templateId: string,
		versionId: string,
	): Observable<void> {
		return this._http.patch<void>(
			`${this._baseUrl}/${archiveId}/templates/${templateId}/versions/${versionId}/publish`,
			{},
		);
	}

	public getTemplateCurrentVersion(archiveId: string, id: string): Observable<TemplateVersion> {
		return this._http.get<TemplateVersion>(
			`${this._baseUrl}/${archiveId}/templates/${id}/current-version`,
		);
	}

	public getTemplateVersion(
		archiveId: string,
		id: string,
		version: number,
	): Observable<TemplateVersion> {
		return this._http.get<TemplateVersion>(
			`${this._baseUrl}/${archiveId}/templates/${id}/versions/${version}`,
		);
	}

	// ---- Records ----
	public createRecord(archiveId: string, body: CreateRecordRequest): Observable<RecordResponse> {
		return this._http.post<RecordResponse>(`${this._baseUrl}/${archiveId}/records`, body);
	}

	public getRecord(archiveId: string, id: string): Observable<RecordResponse> {
		return this._http.get<RecordResponse>(`${this._baseUrl}/${archiveId}/records/${id}`);
	}

	public getRecordsByFolder(archiveId: string, folderId: string): Observable<RecordResponse[]> {
		return this._http.get<RecordResponse[]>(
			`${this._baseUrl}/${archiveId}/folders/${folderId}/records`,
		);
	}

	public searchRecords(archiveId: string, p: SearchRecordsParams): Observable<RecordResponse[]> {
		let params = new HttpParams();
		if (p.searchTerm) params = params.set('searchTerm', p.searchTerm);
		if (p.folderId) params = params.set('folderId', p.folderId);
		if (p.fromDate) params = params.set('fromDate', p.fromDate);
		if (p.toDate) params = params.set('toDate', p.toDate);
		return this._http.get<RecordResponse[]>(`${this._baseUrl}/${archiveId}/records/search`, {
			params,
		});
	}

	public updateRecord(archiveId: string, id: string, body: UpdateRecordRequest): Observable<void> {
		return this._http.put<void>(`${this._baseUrl}/${archiveId}/records/${id}`, body);
	}

	public deleteRecord(archiveId: string, id: string): Observable<void> {
		return this._http.delete<void>(`${this._baseUrl}/${archiveId}/records/${id}`);
	}
}
