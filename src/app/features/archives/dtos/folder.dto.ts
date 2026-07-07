import { FolderType } from '../models/field-type.enum';

export interface CreateFolderRequest {
	parentFolderId: string | null;
	name: string;
	description?: string;
	type?: FolderType;
	order: number;
}

export interface UpdateFolderRequest {
	name: string;
	description?: string;
	order: number;
}
