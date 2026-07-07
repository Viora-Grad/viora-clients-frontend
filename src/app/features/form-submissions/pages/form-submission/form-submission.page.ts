import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Button } from 'primeng/button';
import { AppointmentApi } from '../../../appointments/apis/appointment.api';
import { AppointmentDetail } from '../../../appointments/models/appointment.model';
import { ServiceForm } from '../../../services/models/form.model';
import { FormSubmission, SubmissionFile } from '../../models/form-submission.model';
import { FormSubmissionService } from '../../services/form-submission.service';

interface AnswerRow {
	key: string;
	label: string;
	type: string;
	answer: string | null;
	options?: string[];
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-form-submission',
	imports: [Button],
	templateUrl: './form-submission.page.html',
	styleUrl: './form-submission.page.css',
})
export class FormSubmissionPage implements OnInit {
	private readonly _route = inject(ActivatedRoute);
	private readonly _location = inject(Location);
	private readonly _appointmentApi = inject(AppointmentApi);
	private readonly _service = inject(FormSubmissionService);

	protected readonly isLoading = signal(true);
	protected readonly error = signal<string | null>(null);
	protected readonly fileError = signal<string | null>(null);
	protected readonly downloadingId = signal<string | null>(null);

	protected readonly patientName = signal('');
	protected readonly serviceName = signal<string | null>(null);
	protected readonly reservationDate = signal<string | null>(null);

	protected readonly form = signal<ServiceForm | null>(null);
	protected readonly submission = signal<FormSubmission | null>(null);

	// Build the read-only form: pair each defined field with its submitted answer.
	protected readonly rows = computed<AnswerRow[]>(() => {
		const submission = this.submission();
		const answerMap = new Map((submission?.answers ?? []).map((a) => [a.id, a]));
		const fields = this.form()?.fields;

		if (fields && fields.length > 0) {
			return fields.map((field) => ({
				key: field.name,
				label: field.label || field.name,
				type: field.type,
				answer: answerMap.get(field.name)?.answer ?? null,
				options: field.options,
			}));
		}

		// No field definitions — fall back to whatever the answers contain.
		return (submission?.answers ?? []).map((a) => ({
			key: a.id,
			label: a.id,
			type: a.type,
			answer: a.answer,
		}));
	});

	protected readonly files = computed<SubmissionFile[]>(() => this.submission()?.fileList ?? []);

	private _appointmentId = '';

	public ngOnInit(): void {
		this._appointmentId = this._route.snapshot.paramMap.get('id') ?? '';
		if (!this._appointmentId) {
			this.error.set('Appointment not found.');
			this.isLoading.set(false);
			return;
		}
		void this._load();
	}

	protected goBack(): void {
		this._location.back();
	}

	protected formatDateTime(dateStr: string | null): string {
		if (!dateStr) return '—';
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleString('en-US', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}

	protected displayAnswer(row: AnswerRow): string {
		if (row.answer === null || row.answer.trim() === '') return '—';
		if (row.type === 'date') return this.formatDateTime(row.answer);
		return row.answer;
	}

	protected isTextarea(type: string): boolean {
		return type === 'textarea';
	}

	protected isFileField(type: string): boolean {
		return type === 'file';
	}

	protected async download(file: SubmissionFile): Promise<void> {
		const submission = this.submission();
		if (!submission) return;

		this.downloadingId.set(file.id);
		this.fileError.set(null);
		try {
			const blob = await this._service.getFileBlob(submission.id, file.id);
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = file.fileName || 'download';
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(url);
		} catch {
			this.fileError.set('Failed to download the file. Please try again.');
		} finally {
			this.downloadingId.set(null);
		}
	}

	private async _load(): Promise<void> {
		try {
			const appointment = await firstValueFrom(
				this._appointmentApi.getAppointmentById(this._appointmentId),
			);
			const detail = appointment as unknown as AppointmentDetail;

			const firstName = detail.customerFirstName ?? '';
			const lastName = detail.customerLastName ?? '';
			this.patientName.set(`${firstName} ${lastName}`.trim() || 'Unknown');
			this.serviceName.set(detail.serviceName ?? null);
			this.reservationDate.set(detail.reservationDate ?? null);

			const form = await this._service.getForm(detail.serviceId);
			if (!form) {
				this.error.set('This service has no form.');
				return;
			}
			this.form.set(form);

			const submission = await this._service.getSubmission(form.id, this._appointmentId);
			if (!submission) {
				this.error.set('No form submission was found for this appointment.');
				return;
			}
			this.submission.set(submission);
		} catch {
			this.error.set('Failed to load the form submission.');
		} finally {
			this.isLoading.set(false);
		}
	}
}
