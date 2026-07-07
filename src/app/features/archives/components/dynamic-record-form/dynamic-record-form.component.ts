import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { RecordFieldValueDto } from '../../dtos/record.dto';
import { FieldType } from '../../models/field-type.enum';
import { RecordFieldValue } from '../../models/record.model';
import { TemplateVersionField } from '../../models/template.model';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-dynamic-record-form',
	imports: [ReactiveFormsModule, InputText, Textarea, InputNumber, DatePicker, Checkbox],
	templateUrl: './dynamic-record-form.component.html',
	styleUrl: './dynamic-record-form.component.css',
})
export class DynamicRecordFormComponent {
	public readonly fields = input.required<TemplateVersionField[]>();
	public readonly initialValues = input<RecordFieldValue[]>([]);

	protected readonly fieldType = FieldType;
	protected form = new FormGroup<Record<string, FormControl>>({});
	protected orderedFields: TemplateVersionField[] = [];

	public constructor() {
		effect(() => {
			this._buildForm(this.fields(), this.initialValues());
		});
	}

	/** Returns lean write values, or null when the form is invalid (marks touched). */
	public collect(): RecordFieldValueDto[] | null {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return null;
		}
		return this.orderedFields.map((field) => {
			const raw: unknown = this.form.controls[field.name]?.value;
			return { fieldName: field.name, value: this._serialize(field, raw) };
		});
	}

	protected columnClass(field: TemplateVersionField): string {
		const width = field.layout?.width ?? 12;
		if (width <= 3) return 'col-span-12 sm:col-span-3';
		if (width <= 4) return 'col-span-12 sm:col-span-4';
		if (width <= 6) return 'col-span-12 sm:col-span-6';
		return 'col-span-12';
	}

	private _buildForm(fields: TemplateVersionField[], initial: RecordFieldValue[]): void {
		this.orderedFields = [...fields].sort(
			(a, b) => (a.layout?.order ?? a.order) - (b.layout?.order ?? b.order),
		);
		const initialMap = new Map(initial.map((value) => [value.fieldName, value.value]));

		const group: Record<string, FormControl> = {};
		for (const field of this.orderedFields) {
			group[field.name] = new FormControl(
				this._initialValue(field, initialMap.get(field.name)),
				this._validators(field),
			);
		}
		this.form = new FormGroup(group);
	}

	private _initialValue(field: TemplateVersionField, value: unknown): unknown {
		if (value === undefined || value === null) {
			return field.type === FieldType.Boolean ? false : null;
		}
		if (field.type === FieldType.Date && typeof value === 'string') {
			const date = new Date(value);
			return Number.isNaN(date.getTime()) ? null : date;
		}
		return value;
	}

	private _validators(field: TemplateVersionField): ValidatorFn[] {
		const validators: ValidatorFn[] = [];
		const v = field.validation;
		if (field.required || v?.required) validators.push((c) => Validators.required(c));
		if (v?.minLength != null) validators.push((c) => Validators.minLength(v.minLength!)(c));
		if (v?.maxLength != null) validators.push((c) => Validators.maxLength(v.maxLength!)(c));
		if (v?.min != null) validators.push((c) => Validators.min(v.min!)(c));
		if (v?.max != null) validators.push((c) => Validators.max(v.max!)(c));
		if (v?.regex) validators.push((c) => Validators.pattern(v.regex!)(c));
		return validators;
	}

	private _serialize(field: TemplateVersionField, raw: unknown): string | number | boolean | null {
		if (field.type === FieldType.Date && raw instanceof Date) {
			return raw.toISOString();
		}
		return raw as string;
	}
}
