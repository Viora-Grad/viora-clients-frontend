import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { Archive } from '../../models/archive.model';
import { ArchiveService } from '../../services/archive.service';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-archives',
	imports: [ReactiveFormsModule, Button, Checkbox, Dialog, InputText, Textarea, Toast],
	providers: [MessageService],
	templateUrl: './archives.page.html',
	styleUrl: './archives.page.css',
})
export class ArchivesPage implements OnInit {
	protected readonly archiveService = inject(ArchiveService);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _messageService = inject(MessageService);
	private readonly _router = inject(Router);

	protected readonly isDialogVisible = signal(false);
	protected readonly editingId = signal<string | null>(null);
	protected readonly deleteTarget = signal<Archive | null>(null);
	protected readonly isDeleting = signal(false);

	protected readonly form = new FormGroup({
		name: new FormControl('', { nonNullable: true, validators: [Validators.required] }), // eslint-disable-line @typescript-eslint/unbound-method
		description: new FormControl('', { nonNullable: true }),
		enableVersioning: new FormControl(true, { nonNullable: true }),
		enableAttachments: new FormControl(true, { nonNullable: true }),
		enableExport: new FormControl(false, { nonNullable: true }),
		enableAudit: new FormControl(true, { nonNullable: true }),
	});

	public ngOnInit(): void {
		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;
		void this.archiveService.loadArchives(organizationId);
	}

	protected openCreate(): void {
		this.editingId.set(null);
		this.form.reset({
			name: '',
			description: '',
			enableVersioning: true,
			enableAttachments: true,
			enableExport: false,
			enableAudit: true,
		});
		this.isDialogVisible.set(true);
	}

	protected openEdit(event: Event, archive: Archive): void {
		event.stopPropagation();
		this.editingId.set(archive.id);
		this.form.reset({
			name: archive.name,
			description: archive.description,
			enableVersioning: archive.settings.enableVersioning,
			enableAttachments: archive.settings.enableAttachments,
			enableExport: archive.settings.enableExport,
			enableAudit: archive.settings.enableAudit,
		});
		this.isDialogVisible.set(true);
	}

	protected async save(): Promise<void> {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		const value = this.form.getRawValue();
		const editingId = this.editingId();

		if (editingId) {
			const ok = await this.archiveService.updateArchive(editingId, {
				name: value.name,
				description: value.description,
				enableVersioning: value.enableVersioning,
				enableAttachments: value.enableAttachments,
				enableExport: value.enableExport,
				enableAudit: value.enableAudit,
			});
			this._afterSave(ok, organizationId, 'updated');
		} else {
			const created = await this.archiveService.createArchive({
				organizationId,
				name: value.name,
				description: value.description,
				enableVersioning: value.enableVersioning,
				enableAttachments: value.enableAttachments,
				enableExport: value.enableExport,
				enableAudit: value.enableAudit,
			});
			this._afterSave(created !== null, organizationId, 'created');
		}
	}

	protected navigateToArchive(id: string): void {
		void this._router.navigate(['/archives', id]);
	}

	protected requestDelete(event: Event, archive: Archive): void {
		event.stopPropagation();
		this.deleteTarget.set(archive);
	}

	protected cancelDelete(): void {
		this.deleteTarget.set(null);
	}

	protected async confirmDelete(): Promise<void> {
		const target = this.deleteTarget();
		const organizationId = this._tenantStore.organizationId();
		if (!target || !organizationId) return;

		this.isDeleting.set(true);
		const ok = await this.archiveService.deleteArchive(target.id);
		this.isDeleting.set(false);
		this.deleteTarget.set(null);

		if (ok) {
			this._messageService.add({
				severity: 'success',
				summary: 'Deleted',
				detail: 'Archive deleted.',
			});
			await this.archiveService.loadArchives(organizationId);
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to delete archive.',
			});
		}
	}

	private _afterSave(ok: boolean, organizationId: string, verb: string): void {
		if (ok) {
			this.isDialogVisible.set(false);
			this._messageService.add({
				severity: 'success',
				summary: 'Saved',
				detail: `Archive ${verb}.`,
			});
			void this.archiveService.loadArchives(organizationId);
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: `Failed to ${verb === 'created' ? 'create' : 'update'} archive.`,
			});
		}
	}
}
