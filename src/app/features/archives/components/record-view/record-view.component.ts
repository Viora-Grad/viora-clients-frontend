import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldType } from '../../models/field-type.enum';
import { ArchiveRecord, RecordFieldValue } from '../../models/record.model';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-record-view',
	imports: [],
	templateUrl: './record-view.component.html',
	styleUrl: './record-view.component.css',
})
export class RecordViewComponent {
	public readonly record = input.required<ArchiveRecord>();

	protected displayValue(value: RecordFieldValue): string {
		const raw: unknown = value.value;
		if (raw === null || raw === undefined || raw === '') return '—';
		if (value.fieldType === FieldType.Boolean) return raw ? 'Yes' : 'No';
		if (value.fieldType === FieldType.Date && typeof raw === 'string') {
			const date = new Date(raw);
			if (!Number.isNaN(date.getTime())) {
				return date.toLocaleDateString('en-US', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
				});
			}
		}
		if (typeof raw === 'object') return JSON.stringify(raw);
		if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
		return '—';
	}

	protected formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
}
