import { Location } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	OnDestroy,
	OnInit,
	signal,
	viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService, TreeNode } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { Tree, TreeNodeSelectEvent } from 'primeng/tree';
import { firstValueFrom } from 'rxjs';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { ArchiveApi } from '../../../archives/apis/archive.api';
import { ArchiveTreeNode } from '../../../archives/models/folder.model';
import { Template, TemplateVersionField } from '../../../archives/models/template.model';
import { ArchiveService } from '../../../archives/services/archive.service';
import { RecordService } from '../../../archives/services/record.service';
import { TemplateService } from '../../../archives/services/template.service';
import { DynamicRecordFormComponent } from '../../../archives/components/dynamic-record-form/dynamic-record-form.component';
import { FormSubmissionService } from '../../../form-submissions/services/form-submission.service';
import { PrescriptionApi } from '../../../prescriptions/apis/prescription.api';
import { Prescription, PrescriptionItem } from '../../../prescriptions/models/prescription.model';
import { PrescriptionPrintService } from '../../../prescriptions/services/prescription-print.service';
import { PrescriptionTemplateService } from '../../../prescriptions/services/prescription-template.service';
import { AppointmentApi } from '../../apis/appointment.api';
import { AppointmentDetail } from '../../models/appointment.model';

function createEmptyItem(): PrescriptionItem {
	return { name: '', note: null, dose: '', frequence: '', duration: '' };
}

const STATUS_SEVERITY: Record<string, 'success' | 'warn' | 'danger' | 'secondary' | 'info'> = {
	Completed: 'success',
	InProgress: 'info',
	confirmed: 'warn',
	NotArrived: 'secondary',
	Cancelled: 'danger',
	NoShow: 'danger',
};

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-appointment-detail',
	imports: [
		FormsModule,
		Button,
		Tag,
		Dialog,
		InputText,
		Select,
		Tree,
		Toast,
		RouterLink,
		DynamicRecordFormComponent,
	],
	providers: [MessageService],
	styleUrl: './appointment-detail.page.css',
	templateUrl: './appointment-detail.page.html',
})
export class AppointmentDetailPage implements OnInit, OnDestroy {
	private readonly _route = inject(ActivatedRoute);
	private readonly _location = inject(Location);
	private readonly _appointmentApi = inject(AppointmentApi);
	private readonly _prescriptionApi = inject(PrescriptionApi);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _printService = inject(PrescriptionPrintService);
	private readonly _formSubmissionService = inject(FormSubmissionService);
	protected readonly templateService = inject(PrescriptionTemplateService);
	private readonly _archiveService = inject(ArchiveService);
	private readonly _archiveApi = inject(ArchiveApi);
	private readonly _archiveRecordService = inject(RecordService);
	private readonly _archiveTemplateService = inject(TemplateService);
	private readonly _messageService = inject(MessageService);

	protected readonly appointment = signal<AppointmentDetail | null>(null);
	protected readonly isLoading = signal(true);
	protected readonly error = signal<string | null>(null);
	protected readonly isUpdating = signal(false);

	protected readonly prescription = signal<Prescription | null>(null);
	protected readonly isLoadingPrescription = signal(false);
	protected readonly isPrescriptionDialogVisible = signal(false);
	protected readonly isSavingPrescription = signal(false);
	protected readonly prescriptionError = signal<string | null>(null);
	protected readonly draftItems = signal<PrescriptionItem[]>([createEmptyItem()]);

	protected readonly isPrintDialogVisible = signal(false);
	protected readonly selectedTemplateId = signal<string | null>(null);
	protected readonly isPrinting = signal(false);
	protected readonly printError = signal<string | null>(null);

	protected readonly hasFormSubmission = signal(false);
	protected readonly formSubmissionDate = signal<string | null>(null);

	// ---- Archive record state ----
	protected readonly isArchiveRecordDialogVisible = signal(false);
	protected readonly isSavingArchiveRecord = signal(false);
	protected readonly archiveRecordError = signal<string | null>(null);
	protected readonly selectedArchiveId = signal<string | null>(null);
	protected readonly archiveTree = signal<ArchiveTreeNode | null>(null);
	protected readonly selectedFolderId = signal<string | null>(null);
	protected readonly templatesInFolder = signal<Template[]>([]);
	protected readonly isLoadingTree = signal(false);
	protected readonly selectedTemplateForRecord = signal<Template | null>(null);
	protected readonly recordFields = signal<TemplateVersionField[]>([]);

	protected readonly archiveTreeNodes = computed<TreeNode[]>(() => {
		const tree = this.archiveTree();
		return tree ? [this._toTreeNode(tree)] : [];
	});

	protected readonly archiveOptions = computed(() => {
		return this._archiveService.archives().map((a) => ({ label: a.name, value: a.id }));
	});

	protected readonly canCreateArchiveRecord = computed(() => {
		const status = (this.appointment()?.status ?? '').toLowerCase();
		return status === 'completed' || status === 'inprogress';
	});

	private readonly _recordForm = viewChild(DynamicRecordFormComponent);

	// A prescription can be created only when none exists yet and the visit is
	// active or done (Completed / InProgress).
	protected readonly canCreatePrescription = computed(() => {
		if (this.prescription() !== null || this.isLoadingPrescription()) return false;
		const status = (this.appointment()?.status ?? '').toLowerCase();
		return status === 'completed' || status === 'inprogress';
	});

	protected readonly customerName = signal('');
	protected readonly staffFullName = signal('');

	protected readonly isScannerVisible = signal(false);
	protected readonly scannerError = signal<string | null>(null);
	protected readonly manualCode = signal('');

	private _appointmentId = '';
	private _videoStream: MediaStream | null = null;
	private _animationFrameId: number | null = null;

	public ngOnInit(): void {
		const id = this._route.snapshot.paramMap.get('id');
		if (!id) {
			this.error.set('Appointment ID not found');
			this.isLoading.set(false);
			return;
		}
		this._appointmentId = id;
		void this._loadAppointment(id);
		void this._loadArchives();
	}

	public ngOnDestroy(): void {
		this._stopCamera();
	}

	protected goBack(): void {
		this._location.back();
	}

	protected getStatusSeverity(
		status: string,
	): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
		return STATUS_SEVERITY[status] ?? 'secondary';
	}

	protected getStatusLabel(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
	}

	protected formatDateTime(dateStr: string | null): string {
		if (!dateStr) return '—';
		const date = new Date(dateStr);
		const day = date.getUTCDate();
		const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
		const year = date.getUTCFullYear();
		const hours = date.getUTCHours();
		const minutes = date.getUTCMinutes();
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
		return `${day} ${month} ${year}, ${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
	}

	protected get canMarkNoShow(): boolean {
		return this.appointment()?.status === 'NotArrived';
	}

	protected get canComplete(): boolean {
		return this.appointment()?.status === 'InProgress';
	}

	protected get canCheckIn(): boolean {
		const appt = this.appointment();
		return appt?.status === 'NotArrived' && !appt.isCheckedIn;
	}

	protected async onMarkNoShow(): Promise<void> {
		if (!this._appointmentId) return;
		this.isUpdating.set(true);
		try {
			await new Promise<void>((resolve, reject) => {
				this._appointmentApi.markNoShow(this._appointmentId).subscribe({
					next: () => resolve(),
					error: (err) => reject(err),
				});
			});
			await this._loadAppointment(this._appointmentId);
		} catch {
			this.error.set('Failed to mark as no-show');
		} finally {
			this.isUpdating.set(false);
		}
	}

	protected async onComplete(): Promise<void> {
		if (!this._appointmentId) return;
		this.isUpdating.set(true);
		try {
			await new Promise<void>((resolve, reject) => {
				this._appointmentApi.completeAppointment(this._appointmentId).subscribe({
					next: () => resolve(),
					error: (err) => reject(err),
				});
			});
			await this._loadAppointment(this._appointmentId);
		} catch {
			this.error.set('Failed to complete appointment');
		} finally {
			this.isUpdating.set(false);
		}
	}

	protected openScanner(): void {
		this.scannerError.set(null);
		this.manualCode.set('');
		this.isScannerVisible.set(true);
	}

	protected closeScanner(): void {
		this._stopCamera();
		this.isScannerVisible.set(false);
	}

	protected onDialogVisibleChange(visible: boolean): void {
		if (visible) {
			setTimeout(() => this._startCamera(), 100);
		} else {
			this._stopCamera();
		}
	}

	protected submitManualCode(): void {
		const code = this.manualCode().trim();
		if (!code) return;
		this._stopCamera();
		this.isScannerVisible.set(false);
		void this._checkIn(code);
	}

	private _scanCanvas: HTMLCanvasElement | null = null;
	private _scanCtx: CanvasRenderingContext2D | null = null;
	private _detectIntervalId: ReturnType<typeof setInterval> | null = null;

	private async _startCamera(): Promise<void> {
		const video = document.getElementById('qr-video') as HTMLVideoElement | null;
		if (!video) return;

		try {
			await this._loadJsQRLibrary();

			this._videoStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
			});
			video.srcObject = this._videoStream;
			await video.play();

			this._scanCanvas = document.createElement('canvas');
			this._scanCtx = this._scanCanvas.getContext('2d', { willReadFrequently: true });

			this._detectIntervalId = setInterval(() => this._detectFrame(video), 300);
		} catch {
			this.scannerError.set('Failed to start camera. Please enter the code manually.');
		}
	}

	private _loadJsQRLibrary(): Promise<void> {
		if ((globalThis as Record<string, unknown>)['jsQR']) {
			return Promise.resolve();
		}
		return new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load QR library'));
			document.head.appendChild(script);
		});
	}

	private _detectFrame(video: HTMLVideoElement): void {
		if (!this._scanCanvas || !this._scanCtx) return;
		if (video.readyState < video.HAVE_ENOUGH_DATA) return;

		this._scanCanvas.width = video.videoWidth;
		this._scanCanvas.height = video.videoHeight;
		this._scanCtx.drawImage(video, 0, 0);

		const imageData = this._scanCtx.getImageData(
			0,
			0,
			this._scanCanvas.width,
			this._scanCanvas.height,
		);

		try {
			const jsQRFn = (globalThis as Record<string, unknown>)['jsQR'] as (
				data: Uint8ClampedArray,
				width: number,
				height: number,
				options?: { inversionAttempts?: string },
			) => { data: string } | null;
			if (!jsQRFn) return;
			const code = jsQRFn(imageData.data, imageData.width, imageData.height, {
				inversionAttempts: 'dontInvert',
			});
			if (code?.data) {
				this._stopCamera();
				this.isScannerVisible.set(false);
				void this._checkIn(code.data);
			}
		} catch {
			// jsQR decode error, continue scanning
		}
	}

	private _stopCamera(): void {
		if (this._detectIntervalId !== null) {
			clearInterval(this._detectIntervalId);
			this._detectIntervalId = null;
		}
		if (this._animationFrameId !== null) {
			cancelAnimationFrame(this._animationFrameId);
			this._animationFrameId = null;
		}
		if (this._videoStream) {
			this._videoStream.getTracks().forEach((track) => track.stop());
			this._videoStream = null;
		}
		this._scanCanvas = null;
		this._scanCtx = null;
	}

	private async _checkIn(qrCode: string): Promise<void> {
		if (!this._appointmentId) return;
		this.isUpdating.set(true);
		try {
			await new Promise<void>((resolve, reject) => {
				this._appointmentApi.checkInAppointment(this._appointmentId, qrCode).subscribe({
					next: () => resolve(),
					error: (err) => reject(err),
				});
			});
			await this._loadAppointment(this._appointmentId);
		} catch {
			this.error.set('Check-in failed. Invalid QR code.');
		} finally {
			this.isUpdating.set(false);
		}
	}

	private async _loadAppointment(id: string): Promise<void> {
		try {
			const response = await new Promise<AppointmentDetail>((resolve, reject) => {
				this._appointmentApi.getAppointmentById(id).subscribe({
					next: (data) => resolve(data as unknown as AppointmentDetail),
					error: (err) => reject(err),
				});
			});
			this.appointment.set(response);

			const firstName = response.customerFirstName ?? '';
			const lastName = response.customerLastName ?? '';
			this.customerName.set(`${firstName} ${lastName}`.trim() || 'Unknown');

			const staffFirst = response.staffFirstName ?? '';
			const staffLast = response.staffLastName ?? '';
			this.staffFullName.set(`${staffFirst} ${staffLast}`.trim() || 'Unknown');

			await this._loadPrescription(id);
			void this._checkFormSubmission(response.serviceId, id);
		} catch {
			this.error.set('Failed to load appointment details');
		} finally {
			this.isLoading.set(false);
		}
	}

	private async _checkFormSubmission(serviceId: string, appointmentId: string): Promise<void> {
		const form = await this._formSubmissionService.getForm(serviceId);
		if (!form) return;
		const submission = await this._formSubmissionService.getSubmission(form.id, appointmentId);
		if (submission) {
			this.hasFormSubmission.set(true);
			this.formSubmissionDate.set(submission.createdAt);
		}
	}

	private async _loadPrescription(appointmentId: string): Promise<void> {
		this.isLoadingPrescription.set(true);
		try {
			const prescription = await firstValueFrom(
				this._prescriptionApi.getByAppointment(appointmentId),
			);
			this.prescription.set(prescription);
		} catch {
			// No prescription for this appointment yet.
			this.prescription.set(null);
		} finally {
			this.isLoadingPrescription.set(false);
		}
	}

	protected openPrescriptionDialog(): void {
		this.prescriptionError.set(null);
		this.draftItems.set([createEmptyItem()]);
		this.isPrescriptionDialogVisible.set(true);
	}

	protected closePrescriptionDialog(): void {
		this.isPrescriptionDialogVisible.set(false);
	}

	protected addDraftItem(): void {
		this.draftItems.update((items) => [...items, createEmptyItem()]);
	}

	protected removeDraftItem(index: number): void {
		this.draftItems.update((items) => items.filter((unused, i) => i !== index));
	}

	protected updateDraftItem(
		index: number,
		field: keyof PrescriptionItem,
		value: string | number | null,
	): void {
		const text = value === null || value === undefined ? '' : String(value);
		const stored = field === 'note' ? (text.trim() === '' ? null : text) : text;
		this.draftItems.update((items) =>
			items.map((item, i) => (i === index ? { ...item, [field]: stored } : item)),
		);
	}

	protected async savePrescription(): Promise<void> {
		const items = this.draftItems().filter((item) => item.name.trim().length > 0);
		if (items.length === 0) {
			this.prescriptionError.set('Add at least one medication with a name.');
			return;
		}

		this.isSavingPrescription.set(true);
		this.prescriptionError.set(null);
		try {
			await firstValueFrom(
				this._prescriptionApi.createPrescription({
					appointmentId: this._appointmentId,
					items,
				}),
			);
			this.isPrescriptionDialogVisible.set(false);
			// Re-fetch so the newly created prescription renders in place.
			await this._loadPrescription(this._appointmentId);
		} catch {
			this.prescriptionError.set('Failed to create prescription. Please try again.');
		} finally {
			this.isSavingPrescription.set(false);
		}
	}

	protected openPrintDialog(): void {
		this.printError.set(null);
		this.selectedTemplateId.set(null);
		this.isPrintDialogVisible.set(true);

		const organizationId = this._tenantStore.organizationId();
		if (organizationId) {
			void this.templateService.loadTemplates(organizationId);
		}
	}

	protected closePrintDialog(): void {
		this.isPrintDialogVisible.set(false);
	}

	protected selectTemplate(templateId: string): void {
		this.selectedTemplateId.set(templateId);
	}

	protected async confirmPrint(): Promise<void> {
		const prescription = this.prescription();
		const templateId = this.selectedTemplateId();
		if (!prescription || !templateId) {
			this.printError.set('Please choose a template first.');
			return;
		}

		const template = this.templateService.templates().find((t) => t.id === templateId);
		if (!template) return;

		this.isPrinting.set(true);
		this.printError.set(null);
		try {
			await this._printService.print(prescription, template, this.customerName());
			this.isPrintDialogVisible.set(false);
		} catch (error: unknown) {
			this.printError.set(
				error instanceof Error ? error.message : 'Failed to open the print view.',
			);
		} finally {
			this.isPrinting.set(false);
		}
	}

	// ---- Archive record methods ----

	private async _loadArchives(): Promise<void> {
		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;
		await this._archiveService.loadArchives(organizationId);
	}

	private _toTreeNode(node: ArchiveTreeNode): TreeNode {
		const isTemplate = node.nodeType === 'Template';
		return {
			key: node.id,
			label: node.name,
			icon: isTemplate ? 'pi pi-clone' : 'pi pi-folder',
			data: { type: node.nodeType, id: node.id },
			expanded: node.nodeType === 'Archive',
			leaf: isTemplate,
			children: (node.children ?? []).map((child) => this._toTreeNode(child)),
		};
	}

	protected async onArchiveChange(archiveId: string): Promise<void> {
		this.selectedArchiveId.set(archiveId);
		this.selectedFolderId.set(null);
		this.templatesInFolder.set([]);
		this.selectedTemplateForRecord.set(null);
		this.recordFields.set([]);
		this.isLoadingTree.set(true);
		try {
			const tree = await firstValueFrom(this._archiveApi.getFolderTree(archiveId));
			this.archiveTree.set(tree);
		} catch {
			this.archiveTree.set(null);
		} finally {
			this.isLoadingTree.set(false);
		}
	}

	protected onArchiveTreeNodeSelect(event: TreeNodeSelectEvent): void {
		const data = event.node.data as { type: string; id: string } | undefined;
		if (!data) return;

		if (data.type === 'Template') {
			void this._selectTemplateForRecord(data.id);
			return;
		}

		const archiveId = this.selectedArchiveId();
		if (!archiveId) return;
		const folderId = data.type === 'Archive' ? null : data.id;
		this.selectedFolderId.set(folderId);
		this.selectedTemplateForRecord.set(null);
		this.recordFields.set([]);

		if (folderId) {
			void this._loadTemplatesForFolder(archiveId, folderId);
		} else {
			this.templatesInFolder.set([]);
		}
	}

	protected selectTemplateFromList(templateId: string): void {
		void this._selectTemplateForRecord(templateId);
	}

	private async _loadTemplatesForFolder(archiveId: string, folderId: string): Promise<void> {
		try {
			const templates = await firstValueFrom(
				this._archiveApi.getTemplatesByFolder(archiveId, folderId),
			);
			this.templatesInFolder.set(templates);
		} catch {
			this.templatesInFolder.set([]);
		}
	}

	private async _selectTemplateForRecord(templateId: string): Promise<void> {
		const archiveId = this.selectedArchiveId();
		if (!archiveId) return;
		try {
			const template = await firstValueFrom(this._archiveApi.getTemplate(archiveId, templateId));
			if (template.currentVersion === 0) {
				this._messageService.add({
					severity: 'warn',
					summary: 'No published version',
					detail: 'This template has no published version yet.',
				});
				return;
			}
			const version = await this._archiveTemplateService.getCurrentVersion(archiveId, templateId);
			this.selectedTemplateForRecord.set(template);
			this.recordFields.set(version.fields);
		} catch {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Could not load template fields.',
			});
		}
	}

	protected openArchiveRecordDialog(): void {
		this.archiveRecordError.set(null);
		this.selectedArchiveId.set(null);
		this.archiveTree.set(null);
		this.selectedFolderId.set(null);
		this.templatesInFolder.set([]);
		this.selectedTemplateForRecord.set(null);
		this.recordFields.set([]);
		this.isArchiveRecordDialogVisible.set(true);
	}

	protected async saveArchiveRecord(): Promise<void> {
		const archiveId = this.selectedArchiveId();
		const template = this.selectedTemplateForRecord();
		const form = this._recordForm();
		const appt = this.appointment();
		if (!archiveId || !template || !form || !appt) return;

		const values = form.collect();
		if (!values) return;

		this.isSavingArchiveRecord.set(true);
		this.archiveRecordError.set(null);
		try {
			await this._archiveRecordService.createRecord(archiveId, {
				folderId: this.selectedFolderId() ?? '',
				customerId: appt.customerId ?? '',
				appointmentId: appt.appointmentId,
				templateId: template.id,
				templateVersion: template.currentVersion,
				values,
			});
			this.isArchiveRecordDialogVisible.set(false);
			this._messageService.add({
				severity: 'success',
				summary: 'Created',
				detail: 'Archive record created.',
			});
		} catch {
			this.archiveRecordError.set('Failed to create record. Please try again.');
		} finally {
			this.isSavingArchiveRecord.set(false);
		}
	}
}
