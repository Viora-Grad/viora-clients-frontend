import {
	ChangeDetectionStrategy,
	Component,
	effect,
	inject,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ArchiveRecord } from '../../models/record.model';
import { TemplateVersionField } from '../../models/template.model';
import { RecordService } from '../../services/record.service';
import { TemplateService } from '../../services/template.service';
import { DynamicRecordFormComponent } from '../dynamic-record-form/dynamic-record-form.component';
import { RecordViewComponent } from '../record-view/record-view.component';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-record-list',
	imports: [FormsModule, Button, Dialog, InputText, RecordViewComponent, DynamicRecordFormComponent],
	templateUrl: './record-list.component.html',
	styleUrl: './record-list.component.css',
})
export class RecordListComponent {
	public readonly archiveId = input.required<string>();
	public readonly folderId = input.required<string>();

	protected readonly recordService = inject(RecordService);
	private readonly _templateService = inject(TemplateService);
	private readonly _messageService = inject(MessageService);

	protected readonly searchTerm = signal('');
	protected readonly viewRecord = signal<ArchiveRecord | null>(null);

	protected readonly editRecord = signal<ArchiveRecord | null>(null);
	protected readonly editFields = signal<TemplateVersionField[]>([]);
	protected readonly isSaving = signal(false);

	protected readonly deleteTarget = signal<ArchiveRecord | null>(null);
	protected readonly isDeleting = signal(false);

	private readonly _form = viewChild(DynamicRecordFormComponent);

	public constructor() {
		effect(() => {
			const archiveId = this.archiveId();
			const folderId = this.folderId();
			if (archiveId && folderId) {
				void this.recordService.loadRecordsByFolder(archiveId, folderId);
			}
		});
	}

	protected onSearch(): void {
		const term = this.searchTerm().trim();
		if (!term) {
			void this.recordService.loadRecordsByFolder(this.archiveId(), this.folderId());
			return;
		}
		void this.recordService.searchRecords(this.archiveId(), {
			searchTerm: term,
			folderId: this.folderId(),
		});
	}

	protected async openView(record: ArchiveRecord): Promise<void> {
		const full = await this.recordService.getRecord(this.archiveId(), record.id);
		this.viewRecord.set(full);
	}

	protected async openEdit(record: ArchiveRecord): Promise<void> {
		const full = await this.recordService.getRecord(this.archiveId(), record.id);
		try {
			const version = await this._templateService.getCurrentVersion(
				this.archiveId(),
				full.templateId,
			);
			this.editFields.set(version.fields);
			this.editRecord.set(full);
		} catch {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Could not load the template fields for this record.',
			});
		}
	}

	protected async saveEdit(): Promise<void> {
		const record = this.editRecord();
		const form = this._form();
		if (!record || !form) return;

		const values = form.collect();
		if (!values) return;

		this.isSaving.set(true);
		const ok = await this.recordService.updateRecord(this.archiveId(), record.id, { values });
		this.isSaving.set(false);

		if (ok) {
			this.editRecord.set(null);
			this._messageService.add({ severity: 'success', summary: 'Saved', detail: 'Record updated.' });
			void this.recordService.loadRecordsByFolder(this.archiveId(), this.folderId());
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to update record.',
			});
		}
	}

	protected async confirmDelete(): Promise<void> {
		const target = this.deleteTarget();
		if (!target) return;

		this.isDeleting.set(true);
		const ok = await this.recordService.deleteRecord(this.archiveId(), target.id);
		this.isDeleting.set(false);
		this.deleteTarget.set(null);

		if (ok) {
			this._messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Record deleted.' });
			void this.recordService.loadRecordsByFolder(this.archiveId(), this.folderId());
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to delete record.',
			});
		}
	}

	protected formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	protected summary(record: ArchiveRecord): string {
		const first = record.values[0];
		if (!first) return `Record ${record.id.slice(0, 8)}`;
		const displayValue: unknown = first.value ?? '—';
		if (displayValue === null || displayValue === undefined) return `${first.fieldName}: —`;
		if (typeof displayValue === 'object') return `${first.fieldName}: ${JSON.stringify(displayValue)}`;
		if (typeof displayValue === 'string') return `${first.fieldName}: ${displayValue}`;
		if (typeof displayValue === 'number') return `${first.fieldName}: ${displayValue}`;
		if (typeof displayValue === 'boolean') return `${first.fieldName}: ${displayValue ? 'Yes' : 'No'}`;
		return `${first.fieldName}: —`;
	}
}
