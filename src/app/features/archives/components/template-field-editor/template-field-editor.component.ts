import {
	CdkDrag,
	CdkDragDrop,
	CdkDragHandle,
	CdkDropList,
	moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TemplateFieldDto } from '../../dtos/template.dto';
import { FIELD_TYPE_OPTIONS, FieldType, fieldTypeLabel } from '../../models/field-type.enum';
import { Template } from '../../models/template.model';
import { TemplateService } from '../../services/template.service';

const FIELD_NAME_PATTERN = /^[a-zA-Z0-9_]+$/;

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-template-field-editor',
	imports: [
		CdkDropList,
		CdkDrag,
		CdkDragHandle,
		ReactiveFormsModule,
		Button,
		Checkbox,
		Dialog,
		InputNumber,
		InputText,
		Select,
	],
	templateUrl: './template-field-editor.component.html',
	styleUrl: './template-field-editor.component.css',
})
export class TemplateFieldEditorComponent implements OnInit {
	public readonly archiveId = input.required<string>();
	public readonly template = input.required<Template>();
	public readonly saved = output<void>();

	protected readonly templateService = inject(TemplateService);
	private readonly _messageService = inject(MessageService);

	protected readonly fieldTypeOptions = FIELD_TYPE_OPTIONS;
	protected readonly fields = signal<TemplateFieldDto[]>([]);
	protected readonly isFieldDialogVisible = signal(false);
	protected readonly editingIndex = signal<number | null>(null);
	protected readonly isPublished = signal(false);

	protected readonly fieldForm = new FormGroup({
		name: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required, Validators.pattern(FIELD_NAME_PATTERN)],
		}),
		label: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		type: new FormControl<FieldType>(FieldType.Text, { nonNullable: true }),
		required: new FormControl(false, { nonNullable: true }),
		minLength: new FormControl<number | null>(null),
		maxLength: new FormControl<number | null>(null),
		min: new FormControl<number | null>(null),
		max: new FormControl<number | null>(null),
		regex: new FormControl<string | null>(null),
		width: new FormControl<number>(12, { nonNullable: true }),
	});

	public ngOnInit(): void {
		const template = this.template();
		if (template.currentVersion > 0) {
			void this._loadCurrentVersion();
		}
	}

	protected typeLabel(type: FieldType): string {
		return fieldTypeLabel(type);
	}

	protected onDrop(event: CdkDragDrop<TemplateFieldDto[]>): void {
		const updated = [...this.fields()];
		moveItemInArray(updated, event.previousIndex, event.currentIndex);
		this.fields.set(updated);
	}

	protected openAddField(): void {
		this.editingIndex.set(null);
		this.fieldForm.reset({
			name: '',
			label: '',
			type: FieldType.Text,
			required: false,
			minLength: null,
			maxLength: null,
			min: null,
			max: null,
			regex: null,
			width: 12,
		});
		this.isFieldDialogVisible.set(true);
	}

	protected openEditField(index: number): void {
		const field = this.fields()[index];
		this.editingIndex.set(index);
		this.fieldForm.reset({
			name: field.name,
			label: field.label,
			type: field.type,
			required: field.required,
			minLength: field.validation?.minLength ?? null,
			maxLength: field.validation?.maxLength ?? null,
			min: field.validation?.min ?? null,
			max: field.validation?.max ?? null,
			regex: field.validation?.regex ?? null,
			width: field.layout?.width ?? 12,
		});
		this.isFieldDialogVisible.set(true);
	}

	protected deleteField(index: number): void {
		this.fields.update((fields) => fields.filter((unused, i) => i !== index));
	}

	protected saveField(): void {
		if (this.fieldForm.invalid) {
			this.fieldForm.markAllAsTouched();
			return;
		}
		const value = this.fieldForm.getRawValue();
		const field: TemplateFieldDto = {
			name: value.name,
			label: value.label,
			type: value.type,
			required: value.required,
			order: 0,
			validation: {
				required: value.required,
				minLength: value.minLength,
				maxLength: value.maxLength,
				min: value.min,
				max: value.max,
				regex: value.regex,
			},
			layout: { column: 1, order: 0, width: value.width },
		};

		const index = this.editingIndex();
		if (index === null) {
			this.fields.update((fields) => [...fields, field]);
		} else {
			this.fields.update((fields) => fields.map((f, i) => (i === index ? field : f)));
		}
		this.isFieldDialogVisible.set(false);
	}

	protected async saveVersion(publish: boolean): Promise<void> {
		if (this.fields().length === 0) {
			this._messageService.add({
				severity: 'warn',
				summary: 'No fields',
				detail: 'Add at least one field before saving a version.',
			});
			return;
		}

		const archiveId = this.archiveId();
		const templateId = this.template().id;
		const fields = this.fields().map((field, index) => ({
			...field,
			order: index,
			layout: { ...(field.layout ?? { column: 1, width: 12 }), order: index },
		}));

		const version = await this.templateService.createVersion(archiveId, templateId, { fields });
		if (!version) {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to save version.',
			});
			return;
		}

		if (publish) {
			const published = await this.templateService.publishVersion(archiveId, templateId, version.id);
			if (!published) {
				this._messageService.add({
					severity: 'warn',
					summary: 'Saved, not published',
					detail: 'Version saved but publishing failed.',
				});
				this.saved.emit();
				return;
			}
			this.isPublished.set(true);
		}

		this._messageService.add({
			severity: 'success',
			summary: 'Saved',
			detail: publish ? 'Version saved and published.' : 'Draft version saved.',
		});
		this.saved.emit();
	}

	private async _loadCurrentVersion(): Promise<void> {
		try {
			const version = await this.templateService.getCurrentVersion(
				this.archiveId(),
				this.template().id,
			);
			this.isPublished.set(version.isPublished);
			this.fields.set(
				version.fields.map((field) => ({
					name: field.name,
					label: field.label,
					type: field.type,
					required: field.required,
					order: field.order,
					validation: field.validation,
					layout: field.layout,
				})),
			);
		} catch {
			// no current version yet — start from an empty field set
		}
	}
}
