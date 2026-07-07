import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ArchiveApi } from '../apis/archive.api';
import { CreateFolderRequest, UpdateFolderRequest } from '../dtos/folder.dto';
import { Archive } from '../models/archive.model';
import { ArchiveTreeNode } from '../models/folder.model';

interface ArchiveWorkspaceState {
	archive: Archive | null;
	tree: ArchiveTreeNode | null;
	selectedFolderId: string | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: ArchiveWorkspaceState = {
	archive: null,
	tree: null,
	selectedFolderId: null,
	isLoading: false,
	error: null,
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ArchiveWorkspaceStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withComputed(({ archive }) => ({
		rootFolderId: computed(() => archive()?.rootFolder ?? null),
	})),
	withMethods((store) => {
		const api = inject(ArchiveApi);

		async function refreshTree(archiveId: string): Promise<void> {
			const tree = await firstValueFrom(api.getFolderTree(archiveId));
			patchState(store, { tree });
		}

		return {
			async loadArchive(archiveId: string): Promise<void> {
				patchState(store, { isLoading: true, error: null });
				try {
					const archive = await firstValueFrom(api.getArchive(archiveId));
					patchState(store, { archive });
					await refreshTree(archiveId);
					// Default the selection to the root folder.
					patchState(store, { selectedFolderId: archive.rootFolder });
				} catch {
					patchState(store, { error: 'Failed to load archive.' });
				} finally {
					patchState(store, { isLoading: false });
				}
			},

			async refresh(): Promise<void> {
				const archive = store.archive();
				if (archive) await refreshTree(archive.id);
			},

			selectFolder(folderId: string): void {
				patchState(store, { selectedFolderId: folderId });
			},

			async createFolder(request: CreateFolderRequest): Promise<boolean> {
				const archive = store.archive();
				if (!archive) return false;
				try {
					await firstValueFrom(api.createFolder(archive.id, request));
					await refreshTree(archive.id);
					return true;
				} catch {
					return false;
				}
			},

			async updateFolder(folderId: string, request: UpdateFolderRequest): Promise<boolean> {
				const archive = store.archive();
				if (!archive) return false;
				try {
					await firstValueFrom(api.updateFolder(archive.id, folderId, request));
					await refreshTree(archive.id);
					return true;
				} catch {
					return false;
				}
			},

			async deleteFolder(folderId: string): Promise<boolean> {
				const archive = store.archive();
				if (!archive) return false;
				try {
					await firstValueFrom(api.deleteFolder(archive.id, folderId));
					if (store.selectedFolderId() === folderId) {
						patchState(store, { selectedFolderId: archive.rootFolder });
					}
					await refreshTree(archive.id);
					return true;
				} catch {
					return false;
				}
			},

			reset(): void {
				patchState(store, initialState);
			},
		};
	}),
);
