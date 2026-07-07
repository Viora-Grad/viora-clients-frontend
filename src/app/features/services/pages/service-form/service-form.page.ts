import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormField } from '../../models/form.model';
import { FormService } from '../../services/form.service';

const FIELD_NAME_PATTERN = /^[a-zA-Z0-9_]+$/;

const FIELD_TYPES: { label: string; value: FormField['type'] }[] = [
	{ label: 'Text', value: 'text' },
	{ label: 'Textarea', value: 'textarea' },
	{ label: 'Number', value: 'number' },
	{ label: 'Email', value: 'email' },
	{ label: 'Phone', value: 'phone' },
	{ label: 'Date', value: 'date' },
	{ label: 'Select', value: 'select' },
	{ label: 'File', value: 'file' },
];

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-service-form',
	imports: [
		CdkDropList,
		CdkDrag,
		CdkDragHandle,
		ReactiveFormsModule,
		Button,
		InputText,
		Select,
		Checkbox,
		Dialog,
		Toast,
	],
	providers: [MessageService],
	templateUrl: './service-form.page.html',
	styleUrl: './service-form.page.css',
})
export class ServiceFormPage implements OnInit {
	private readonly _route = inject(ActivatedRoute);
	private readonly _location = inject(Location);
	private readonly _formBuilder = inject(NonNullableFormBuilder);
	private readonly _formService = inject(FormService);
	private readonly _messageService = inject(MessageService);

	protected readonly fieldTypes = FIELD_TYPES;
	protected readonly fields = signal<FormField[]>([]);
	protected readonly selectedIndex = signal<number | null>(null);
	protected readonly isSubmitting = signal(false);
	protected readonly isAddFieldVisible = signal(false);
	protected readonly hasForm = signal(false);

	protected readonly formName = new FormControl('', { validators: Validators.required }); // eslint-disable-line @typescript-eslint/unbound-method

	protected readonly newFieldForm = new FormGroup({
		name: new FormControl('', { validators: [Validators.required, Validators.pattern(FIELD_NAME_PATTERN)] }), // eslint-disable-line @typescript-eslint/unbound-method
		type: new FormControl<FormField['type']>('text', { validators: Validators.required }), // eslint-disable-line @typescript-eslint/unbound-method
		label: new FormControl('', { validators: Validators.required }), // eslint-disable-line @typescript-eslint/unbound-method
		required: new FormControl(false),
	});

	protected readonly editFieldForm = new FormGroup({
		name: new FormControl('', { validators: [Validators.required, Validators.pattern(FIELD_NAME_PATTERN)] }), // eslint-disable-line @typescript-eslint/unbound-method
		type: new FormControl<FormField['type']>('text', { validators: Validators.required }), // eslint-disable-line @typescript-eslint/unbound-method
		label: new FormControl('', { validators: Validators.required }), // eslint-disable-line @typescript-eslint/unbound-method
		required: new FormControl(false),
	});

	private _serviceId = '';

	protected readonly selectedField = new FormGroup({
		options: new FormArray<FormControl<string>>([]),
		accept: new FormArray<FormControl<string>>([]),
	});

	protected get newFieldName(): FormControl<string> {
		return this.newFieldForm.get('name') as FormControl<string>;
	}

	protected get newFieldLabel(): FormControl<string> {
		return this.newFieldForm.get('label') as FormControl<string>;
	}

	protected get newFieldTypeCtrl(): FormControl<FormField['type']> {
		return this.newFieldForm.get('type') as FormControl<FormField['type']>;
	}

	protected get newFieldRequired(): FormControl<boolean> {
		return this.newFieldForm.get('required') as FormControl<boolean>;
	}

	protected get editFieldName(): FormControl<string> {
		return this.editFieldForm.get('name') as FormControl<string>;
	}

	protected get editFieldLabel(): FormControl<string> {
		return this.editFieldForm.get('label') as FormControl<string>;
	}

	protected get editFieldTypeCtrl(): FormControl<FormField['type']> {
		return this.editFieldForm.get('type') as FormControl<FormField['type']>;
	}

	protected get editFieldRequired(): FormControl<boolean> {
		return this.editFieldForm.get('required') as FormControl<boolean>;
	}

	protected get selectedFieldType(): FormField['type'] {
		return this.editFieldForm.get('type')?.value ?? 'text';
	}

	protected get optionsArray(): FormArray<FormControl<string>> {
		return this.selectedField.get('options') as FormArray<FormControl<string>>;
	}

	protected get acceptArray(): FormArray<FormControl<string>> {
		return this.selectedField.get('accept') as FormArray<FormControl<string>>;
	}

	protected get newFieldType(): FormField['type'] {
		return this.newFieldForm.get('type')?.value ?? 'text';
	}

	public ngOnInit(): void {
		this._serviceId = this._route.snapshot.paramMap.get('id') ?? '';
		void this._formService.loadForm(this._serviceId).then((success) => {
			if (success && this._formService.currentForm()) {
				const form = this._formService.currentForm()!;
				this.formName.setValue(form.name);
				this.hasForm.set(true);
				if (form.fields && form.fields.length > 0) {
					this.fields.set([...form.fields]);
				}
			}
		});
	}

	protected onDrop(event: CdkDragDrop<FormField[]>): void {
		const updated = [...this.fields()];
		moveItemInArray(updated, event.previousIndex, event.currentIndex);
		this.fields.set(updated);
	}

	protected openAddFieldDialog(): void {
		this.newFieldForm.reset({ name: '', type: 'text', label: '', required: false });
		this._clearSelectedFieldArrays();
		this.isAddFieldVisible.set(true);
	}

	protected onAddFieldTypeChange(): void {
		const type = this.newFieldForm.get('type')?.value;
		this._clearSelectedFieldArrays();
		if (type === 'select') {
			this._addOptionToArray('');
		}
		if (type === 'file') {
			this._addAcceptToArray('');
		}
	}

	protected onEditFieldTypeChange(): void {
		const type = this.editFieldForm.get('type')?.value;
		const idx = this.selectedIndex();
		if (idx === null) return;

		const currentField = this.fields()[idx];

		if (type === 'select') {
			if (currentField.type !== 'select') {
				this._clearSelectedFieldArrays();
				this._addOptionToArray('');
			} else {
				this._syncOptionsArray(currentField.options ?? []);
			}
		} else if (type === 'file') {
			if (currentField.type !== 'file') {
				this._clearSelectedFieldArrays();
				this._addAcceptToArray('');
			} else {
				this._syncAcceptArray(currentField.accept ?? []);
			}
		} else {
			this._clearSelectedFieldArrays();
		}
	}

	protected addOption(): void {
		this._addOptionToArray('');
	}

	protected removeOption(index: number): void {
		this.optionsArray.removeAt(index);
	}

	protected addAccept(): void {
		this._addAcceptToArray('');
	}

	protected removeAccept(index: number): void {
		this.acceptArray.removeAt(index);
	}

	protected submitAddField(): void {
		if (this.newFieldForm.invalid) return;

		const field: FormField = {
			name: this.newFieldForm.value.name!,
			type: this.newFieldForm.value.type!,
			label: this.newFieldForm.value.label!,
			required: this.newFieldForm.value.required!,
		};

		if (field.type === 'select') {
			field.options = this.optionsArray.value.filter((v) => v.trim() !== '');
		}

		if (field.type === 'file') {
			field.accept = this.acceptArray.value.filter((v) => v.trim() !== '');
		}

		this.fields.set([...this.fields(), field]);
		this.isAddFieldVisible.set(false);
	}

	protected selectField(index: number): void {
		this.selectedIndex.set(index);
		const field = this.fields()[index];
		this.editFieldForm.patchValue({
			name: field.name,
			type: field.type,
			label: field.label,
			required: field.required,
		});
		this._clearSelectedFieldArrays();
		if (field.type === 'select' && field.options) {
			for (const opt of field.options) {
				this._addOptionToArray(opt);
			}
		}
		if (field.type === 'file' && field.accept) {
			for (const acc of field.accept) {
				this._addAcceptToArray(acc);
			}
		}
	}

	protected saveEditField(): void {
		const idx = this.selectedIndex();
		if (idx === null) return;
		if (this.editFieldForm.invalid) return;

		const updated = [...this.fields()];
		updated[idx] = {
			name: this.editFieldForm.value.name!,
			type: this.editFieldForm.value.type!,
			label: this.editFieldForm.value.label!,
			required: this.editFieldForm.value.required!,
		};

		if (updated[idx].type === 'select') {
			updated[idx].options = this.optionsArray.value.filter((v) => v.trim() !== '');
		}

		if (updated[idx].type === 'file') {
			updated[idx].accept = this.acceptArray.value.filter((v) => v.trim() !== '');
		}

		this.fields.set(updated);
	}

	protected deleteField(index: number): void {
		const updated = this.fields().filter((_, i) => i !== index);
		this.fields.set(updated);
		if (this.selectedIndex() === index) {
			this.selectedIndex.set(null);
		} else if (this.selectedIndex() !== null && this.selectedIndex()! > index) {
			this.selectedIndex.set(this.selectedIndex()! - 1);
		}
	}

	protected async createForm(): Promise<void> {
		if (this.formName.invalid) return;

		this.isSubmitting.set(true);

		const fields = this.fields().length > 0 ? this.fields() : null;
		const success = await this._formService.createForm(this._serviceId, this.formName.value!, fields);

		if (success) {
			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Form created successfully',
			});
			this.hasForm.set(true);
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to create form',
			});
		}

		this.isSubmitting.set(false);
	}

	protected async updateForm(): Promise<void> {
		const form = this._formService.currentForm();
		if (!form) return;

		this.isSubmitting.set(true);

		const fields = this.fields().length > 0 ? this.fields() : [];
		const success = await this._formService.updateForm(form.id, fields);

		if (success) {
			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Form updated successfully',
			});
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to update form',
			});
		}

		this.isSubmitting.set(false);
	}

	protected async deleteForm(): Promise<void> {
		const form = this._formService.currentForm();
		if (!form) return;

		this.isSubmitting.set(true);

		const success = await this._formService.deleteForm(form.id);

		if (success) {
			this._messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Form deleted successfully',
			});
			this.hasForm.set(false);
			this.fields.set([]);
			this.selectedIndex.set(null);
			this.formName.setValue('');
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to delete form',
			});
		}

		this.isSubmitting.set(false);
	}

	protected goBack(): void {
		this._location.back();
	}

	private _clearSelectedFieldArrays(): void {
		while (this.optionsArray.length) this.optionsArray.removeAt(0);
		while (this.acceptArray.length) this.acceptArray.removeAt(0);
	}

	private _addOptionToArray(value: string): void {
		this.optionsArray.push(this._formBuilder.control(value));
	}

	private _addAcceptToArray(value: string): void {
		this.acceptArray.push(this._formBuilder.control(value));
	}

	private _syncOptionsArray(options: string[]): void {
		this._clearSelectedFieldArrays();
		for (const opt of options) {
			this._addOptionToArray(opt);
		}
	}

	private _syncAcceptArray(accept: string[]): void {
		this._clearSelectedFieldArrays();
		for (const acc of accept) {
			this._addAcceptToArray(acc);
		}
	}
}
