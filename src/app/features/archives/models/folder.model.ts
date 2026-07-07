import { FolderType, TreeNodeType } from './field-type.enum';

export interface Folder {
	id: string;
	archiveId: string;
	parentFolderId: string | null;
	name: string;
	description: string;
	type: FolderType;
	order: number;
	createdAt: string;
}

/** GetFolderTree returns ONE root node (nodeType: "Archive") with nested children. */
export interface ArchiveTreeNode {
	id: string;
	name: string;
	nodeType: TreeNodeType;
	order: number;
	children: ArchiveTreeNode[];
}
