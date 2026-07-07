import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	signal,
	viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	AbstractControl,
	NonNullableFormBuilder,
	ReactiveFormsModule,
	ValidationErrors,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { PrescriptionTemplateService } from '../../services/prescription-template.service';

function requiredValidator(): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => Validators.required(control);
}

function minValidator(min: number): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => Validators.min(min)(control);
}

function maxValidator(max: number): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => Validators.max(max)(control);
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-create-prescription-template',
	imports: [ReactiveFormsModule, Button, InputText, InputNumber, Toast],
	providers: [MessageService],
	templateUrl: './create-prescription-template.page.html',
	styleUrl: './create-prescription-template.page.css',
})
export class CreatePrescriptionTemplatePage {
	protected readonly templateService = inject(PrescriptionTemplateService);
	private readonly _tenantStore = inject(TenantStore);
	private readonly _formBuilder = inject(NonNullableFormBuilder);
	private readonly _messageService = inject(MessageService);
	private readonly _router = inject(Router);

	// Margins are stored as PERCENTAGES of the media dimensions so the previewed
	// text area maps identically onto the image at any output resolution when the
	// prescription is later rendered to a PDF.
	protected readonly form = this._formBuilder.group({
		name: ['', [requiredValidator()]],
		topMargin: [8, [requiredValidator(), minValidator(0), maxValidator(100)]],
		rightMargin: [8, [requiredValidator(), minValidator(0), maxValidator(100)]],
		leftMargin: [8, [requiredValidator(), minValidator(0), maxValidator(100)]],
		bottomMargin: [8, [requiredValidator(), minValidator(0), maxValidator(100)]],
	});

	protected readonly selectedFile = signal<File | null>(null);
	protected readonly hasImage = signal(false);
	protected readonly naturalWidth = signal(0);
	protected readonly naturalHeight = signal(0);

	// Live margin percentages so the preview redraws as the user types.
	protected readonly margins = signal({ top: 8, right: 8, bottom: 8, left: 8 });

	private readonly _previewCanvas = viewChild<ElementRef<HTMLCanvasElement>>('previewCanvas');
	private readonly _image = new Image();
	private _objectUrl: string | null = null;

	public constructor() {
		this._image.onload = (): void => {
			this.naturalWidth.set(this._image.naturalWidth);
			this.naturalHeight.set(this._image.naturalHeight);
			this.hasImage.set(true);
		};

		// Keep the live margins in sync with the form so the preview redraws
		// on typing, spinner clicks, or any other value change.
		this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((value) => {
			this.margins.set({
				top: value.topMargin ?? 0,
				right: value.rightMargin ?? 0,
				bottom: value.bottomMargin ?? 0,
				left: value.leftMargin ?? 0,
			});
		});

		// Redraw whenever the photo, its dimensions, the canvas, or the margins change.
		effect(() => {
			this.hasImage();
			this.naturalWidth();
			this.margins();
			this._previewCanvas();
			this._draw();
		});
	}

	protected onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		this._revokeObjectUrl();
		this.hasImage.set(false);
		this.selectedFile.set(file);

		this._objectUrl = URL.createObjectURL(file);
		this._image.src = this._objectUrl;
	}

	protected async onSubmit(): Promise<void> {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const file = this.selectedFile();
		if (!file) {
			this._messageService.add({
				severity: 'warn',
				summary: 'Photo required',
				detail: 'Please select a prescription photo before saving.',
			});
			return;
		}

		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		const value = this.form.getRawValue();
		const success = await this.templateService.createTemplate({
			organizationId,
			name: value.name,
			file,
			topMargin: value.topMargin.toString(),
			rightMargin: value.rightMargin.toString(),
			leftMargin: value.leftMargin.toString(),
			bottomMargin: value.bottomMargin.toString(),
		});

		if (success) {
			await this.templateService.loadTemplates(organizationId);
			void this._router.navigate(['/prescriptions']);
		} else {
			this._messageService.add({
				severity: 'error',
				summary: 'Failed to create template',
				detail: 'Something went wrong. Please try again.',
			});
		}
	}

	protected onCancel(): void {
		void this._router.navigate(['/prescriptions']);
	}

	private _draw(): void {
		const canvasRef = this._previewCanvas();
		if (!canvasRef || !this.hasImage()) return;

		const width = this.naturalWidth();
		const height = this.naturalHeight();
		if (width === 0 || height === 0) return;

		const canvas = canvasRef.nativeElement;
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(this._image, 0, 0, width, height);

		// Margins are percentages of the media dimensions.
		const { top, right, bottom, left } = this.margins();
		const boxX = (left / 100) * width;
		const boxY = (top / 100) * height;
		const boxWidth = Math.max(0, width - ((left + right) / 100) * width);
		const boxHeight = Math.max(0, height - ((top + bottom) / 100) * height);

		ctx.save();
		ctx.fillStyle = 'rgba(32, 19, 53, 0.06)';
		ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

		// Sample text so the writable area shows where text will actually land.
		if (boxWidth > 0 && boxHeight > 0) {
			ctx.save();
			ctx.beginPath();
			ctx.rect(boxX, boxY, boxWidth, boxHeight);
			ctx.clip();

			const fontSize = Math.max(10, width * 0.02);
			const lineHeight = fontSize * 1.6;
			ctx.fillStyle = 'rgba(32, 19, 53, 0.55)';
			ctx.font = `${fontSize}px sans-serif`;
			ctx.textBaseline = 'top';

			let y = boxY + lineHeight * 0.15;
			let line = 0;
			while (y + fontSize <= boxY + boxHeight && line < 60) {
				ctx.fillText('Sample prescription text', boxX + fontSize * 0.3, y);
				y += lineHeight;
				line++;
			}
			ctx.restore();
		}

		ctx.strokeStyle = '#201335';
		ctx.lineWidth = Math.max(2, width * 0.004);
		ctx.setLineDash([width * 0.02, width * 0.012]);
		ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
		ctx.restore();
	}

	private _revokeObjectUrl(): void {
		if (this._objectUrl) {
			URL.revokeObjectURL(this._objectUrl);
			this._objectUrl = null;
		}
	}
}
