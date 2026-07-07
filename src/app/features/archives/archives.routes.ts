import { Routes } from '@angular/router';

export const ARCHIVES_ROUTES: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./pages/archives/archives.page').then((m) => m.ArchivesPage),
	},
	{
		path: ':archiveId',
		loadComponent: () =>
			import('./pages/archive-workspace/archive-workspace.page').then(
				(m) => m.ArchiveWorkspacePage,
			),
	},
];
