import {
	ChangeDetectionStrategy,
	Component,
	effect,
	inject,
	input,
	output,
	signal,
	viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Template, TemplateVersionField } from '../../models/template.model';
import { RecordService } from '../../services/record.service';
import { TemplateService } from '../../services/template.service';
import { DynamicRecordFormComponent } from '../dynamic-record-form/dynamic-record-form.component';
import { RecordListComponent } from '../record-list/record-list.component';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-folder-content',
	imports: [
		ReactiveFormsModule,
		Button,
		Dialog,
		InputText,
		Textarea,
		RecordListComponent,
		DynamicRecordFormComponent,
	],
	templateUrl: './folder-content.component.html',
	styleUrl: './folder-content.component.css',
})
export class FolderContentComponent {
	public readonly archiveId = input.required<string>();
	public readonly folderId = input.required<string>();
	public readonly openTemplate = output<Template>();

	protected readonly templateService = inject(TemplateService);
	protected readonly recordService = inject(RecordService);
	private readonly _messageService = inject(MessageService);

	protected readonly isTemplateDialogVisible = signal(false);
	protected readonly deleteTarget = signal<Template | null>(null);
	protected readonly isDeleting = signal(false);

	protected readonly templateForm = new FormGroup({
		name: new FormControl('', { nonNullable: true, validators: [Validators.required] }), // eslint-disable-line @typescript-eslint/unbound-method
		description: new FormControl('', { nonNullable: true }),
	});

	// ---- Record creation ----
	protected readonly isRecordDialogVisible = signal(false);
	protected readonly creatingFromTemplate = signal<Template | null>(null);
	protected readonly recordFields = signal<TemplateVersionField[]>([]);
	protected readonly isSavingRecord = signal(false);

	protected readonly customerIdForm = new FormGroup({
		customerId: new FormControl('', { nonNullable: true, validators: [Validators.required] }), // eslint-disable-line @typescript-eslint/unbound-method
	});

	private readonly _recordForm = viewChild(DynamicRecordFormComponent);

	public constructor() {
		effect(() => {
			const archiveId = this.archiveId();
			const folderId = this.folderId();
			if (archiveId && folderId) {
				void this.templateService.loadTemplatesByFolder(archiveId, folderId);
			}
		});
	}

	protected openCreateTemplate(): void {
		this.templateForm.reset({ name: '', description: '' });
		this.isTemplateDialogVisible.set(true);
	}

	protected async createTemplate(): Promise<void> {
		if (this.templateForm.invalid) {
			this.templateForm.markAllAsTouched();
			return;
		}
		const value = this.templateForm.getRawValue();
		const created = await this.templateService.createTemplate(this.archiveId(), {
			folderId: this.folderId(),
			name: value.name,
			description: value.description,
		});

		if (created) {
			this.isTemplateDialogVisible.set(false);
			this._messageService.add({
				severity: 'success',
				summary: 'Created',
				detail: 'Template created. Add fields and publish a version.',
			});
			void this.templateService.loadTemplatesByFolder(this.archiveId(), this.folderId());
			this.openTemplate.emit(created);
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to create template.',
			});
		}
	}

	protected async confirmDeleteTemplate(): Promise<void> {
		const target = this.deleteTarget();
		if (!target) return;

		this.isDeleting.set(true);
		const ok = await this.templateService.deleteTemplate(this.archiveId(), target.id);
		this.isDeleting.set(false);
		this.deleteTarget.set(null);

		if (ok) {
			this._messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Template deleted.' });
			void this.templateService.loadTemplatesByFolder(this.archiveId(), this.folderId());
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to delete template.',
			});
		}
	}

	// ---- Record creation ----
	protected async openCreateRecord(template: Template): Promise<void> {
		if (template.currentVersion === 0) {
			this._messageService.add({
				severity: 'warn',
				summary: 'No published version',
				detail: 'This template has no published version. Publish a version first.',
			});
			return;
		}

		try {
			const version = await this.templateService.getCurrentVersion(this.archiveId(), template.id);
			this.recordFields.set(version.fields);
			this.creatingFromTemplate.set(template);
			this.customerIdForm.reset({ customerId: '' });
			this.isRecordDialogVisible.set(true);
		} catch {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Could not load template fields.',
			});
		}
	}

	protected async saveRecord(): Promise<void> {
		if (this.customerIdForm.invalid) {
			this.customerIdForm.markAllAsTouched();
			return;
		}

		const form = this._recordForm();
		const template = this.creatingFromTemplate();
		if (!form || !template) return;

		const values = form.collect();
		if (!values) return;

		this.isSavingRecord.set(true);
		const result = await this.recordService.createRecord(this.archiveId(), {
			folderId: this.folderId(),
			customerId: this.customerIdForm.getRawValue().customerId,
			appointmentId: null,
			templateId: template.id,
			templateVersion: template.currentVersion,
			values,
		});
		this.isSavingRecord.set(false);

		if (result) {
			this.isRecordDialogVisible.set(false);
			this._messageService.add({
				severity: 'success',
				summary: 'Created',
				detail: 'Record created.',
			});
			void this.recordService.loadRecordsByFolder(this.archiveId(), this.folderId());
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to create record.',
			});
		}
	}
}
