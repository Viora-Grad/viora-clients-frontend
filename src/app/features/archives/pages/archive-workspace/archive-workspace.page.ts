import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService, TreeNode } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { Tree, TreeNodeSelectEvent } from 'primeng/tree';
import { ArchiveTreeNode } from '../../models/folder.model';
import { Template } from '../../models/template.model';
import { TemplateService } from '../../services/template.service';
import { ArchiveWorkspaceStore } from '../../stores/archive-workspace.store';
import { FolderContentComponent } from '../../components/folder-content/folder-content.component';
import { TemplateFieldEditorComponent } from '../../components/template-field-editor/template-field-editor.component';

function toTreeNode(node: ArchiveTreeNode): TreeNode {
	const isTemplate = node.nodeType === 'Template';
	return {
		key: node.id,
		label: node.name,
		icon: isTemplate ? 'pi pi-clone' : 'pi pi-folder',
		data: { type: node.nodeType, id: node.id },
		expanded: node.nodeType === 'Archive',
		leaf: isTemplate,
		children: (node.children ?? []).map(toTreeNode),
	};
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-archive-workspace',
	imports: [
		ReactiveFormsModule,
		Button,
		Dialog,
		InputText,
		Textarea,
		Toast,
		Tree,
		FolderContentComponent,
		TemplateFieldEditorComponent,
	],
	providers: [MessageService],
	templateUrl: './archive-workspace.page.html',
	styleUrl: './archive-workspace.page.css',
})
export class ArchiveWorkspacePage implements OnInit, OnDestroy {
	protected readonly store = inject(ArchiveWorkspaceStore);
	private readonly _templateService = inject(TemplateService);
	private readonly _route = inject(ActivatedRoute);
	private readonly _location = inject(Location);
	private readonly _messageService = inject(MessageService);

	protected readonly selectedTemplate = signal<Template | null>(null);

	protected readonly treeNodes = computed<TreeNode[]>(() => {
		const tree = this.store.tree();
		return tree ? [toTreeNode(tree)] : [];
	});

	protected readonly isFolderDialogVisible = signal(false);
	protected readonly editingFolderId = signal<string | null>(null);
	protected readonly deleteFolderId = signal<string | null>(null);
	protected readonly isDeletingFolder = signal(false);

	protected readonly folderForm = new FormGroup({
		name: new FormControl('', { nonNullable: true, validators: [Validators.required] }), // eslint-disable-line @typescript-eslint/unbound-method
		description: new FormControl('', { nonNullable: true }),
		order: new FormControl<number>(0, { nonNullable: true }),
	});

	public ngOnInit(): void {
		const archiveId = this._route.snapshot.paramMap.get('archiveId');
		if (archiveId) void this.store.loadArchive(archiveId);
	}

	public ngOnDestroy(): void {
		this.store.reset();
	}

	protected goBack(): void {
		this._location.back();
	}

	protected onNodeSelect(event: TreeNodeSelectEvent): void {
		const data = event.node.data as { type: string; id: string } | undefined;
		if (!data) return;

		if (data.type === 'Template') {
			void this._openTemplateById(data.id);
			return;
		}

		this.selectedTemplate.set(null);
		const folderId = data.type === 'Archive' ? (this.store.rootFolderId() ?? data.id) : data.id;
		this.store.selectFolder(folderId);
	}

	protected openTemplateEditor(template: Template): void {
		this.selectedTemplate.set(template);
	}

	protected closeTemplateEditor(): void {
		this.selectedTemplate.set(null);
	}

	protected onTemplateSaved(): void {
		void this.store.refresh();
	}

	// ---- Folder CRUD ----
	protected openCreateFolder(): void {
		this.editingFolderId.set(null);
		this.folderForm.reset({ name: '', description: '', order: 0 });
		this.isFolderDialogVisible.set(true);
	}

	protected openRenameFolder(): void {
		const folderId = this.store.selectedFolderId();
		if (!folderId) return;
		this.editingFolderId.set(folderId);
		this.folderForm.reset({ name: '', description: '', order: 0 });
		this.isFolderDialogVisible.set(true);
	}

	protected async saveFolder(): Promise<void> {
		if (this.folderForm.invalid) {
			this.folderForm.markAllAsTouched();
			return;
		}
		const value = this.folderForm.getRawValue();
		const editingId = this.editingFolderId();

		const ok = editingId
			? await this.store.updateFolder(editingId, {
					name: value.name,
					description: value.description,
					order: value.order,
				})
			: await this.store.createFolder({
					parentFolderId: this.store.selectedFolderId(),
					name: value.name,
					description: value.description,
					order: value.order,
				});

		if (ok) {
			this.isFolderDialogVisible.set(false);
			this._messageService.add({ severity: 'success', summary: 'Saved', detail: 'Folder saved.' });
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to save folder.',
			});
		}
	}

	protected async confirmDeleteFolder(): Promise<void> {
		const folderId = this.deleteFolderId();
		if (!folderId) return;

		this.isDeletingFolder.set(true);
		const ok = await this.store.deleteFolder(folderId);
		this.isDeletingFolder.set(false);
		this.deleteFolderId.set(null);

		if (ok) {
			this._messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Folder deleted.' });
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to delete folder.',
			});
		}
	}

	protected requestDeleteSelectedFolder(): void {
		const folderId = this.store.selectedFolderId();
		if (folderId) this.deleteFolderId.set(folderId);
	}

	private async _openTemplateById(templateId: string): Promise<void> {
		const archive = this.store.archive();
		if (!archive) return;
		try {
			const template = await this._templateService.getTemplate(archive.id, templateId);
			this.selectedTemplate.set(template);
		} catch {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to open template.',
			});
		}
	}
}
