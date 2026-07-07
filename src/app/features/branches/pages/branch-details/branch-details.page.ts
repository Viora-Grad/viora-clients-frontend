import { DatePipe, Location, NgClass } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import * as L from 'leaflet';
import { BranchApi } from '../../../../core/branch/apis/branch.api';
import { BranchDetail } from '../../../../core/branch/models/branch-detail.model';

 
const STATUS_LABELS: Record<number, string> = {
	0: 'Active',
	1: 'Hidden',
	2: 'Disabled',
	3: 'Closed',
};

const STATUS_CLASSES: Record<number, string> = {
	0: 'bg-green-100 text-green-700',
	1: 'bg-yellow-100 text-yellow-700',
	2: 'bg-orange-100 text-orange-700',
	3: 'bg-red-100 text-red-700',
};
 

const PHONE_REGEX = /^\+\d[\d\s\-()]{6,19}$/;

const STATUS_OPTIONS = [
	{ label: 'Active', value: 0 },
	{ label: 'Hidden', value: 1 },
	{ label: 'Disabled', value: 2 },
	{ label: 'Closed', value: 3 },
];

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-branch-details',
	imports: [Button, DatePipe, NgClass, Dialog, FormsModule, InputText, Select, Toast],
	providers: [MessageService],
	templateUrl: './branch-details.page.html',
	styleUrl: './branch-details.page.css',
})
export class BranchDetailsPage implements OnInit, AfterViewInit, OnDestroy {
	private readonly _activatedRoute = inject(ActivatedRoute);
	private readonly _branchApi = inject(BranchApi);
	private readonly _location = inject(Location);
	private readonly _messageService = inject(MessageService);

	private readonly _mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

	private _map: L.Map | null = null;

	protected readonly branch = signal<BranchDetail | null>(null);
	protected readonly isLoading = signal(true);
	protected readonly error = signal<string | null>(null);

	protected readonly isPhoneDialogVisible = signal(false);
	protected readonly phoneNumbers = signal<string[]>([]);
	protected readonly newPhoneNumber = signal('');
	protected readonly phoneError = signal('');
	protected readonly isSaving = signal(false);
	protected readonly isUpdatingStatus = signal(false);

	protected readonly statusOptions = STATUS_OPTIONS;

	public ngOnInit(): void {
		const id = this._activatedRoute.snapshot.paramMap.get('id');
		if (!id) {
			this.error.set('Branch ID not found');
			this.isLoading.set(false);
			return;
		}
		this._loadBranch(id);
	}

	public ngAfterViewInit(): void {
		this._initMap();
	}

	public ngOnDestroy(): void {
		this._destroyMap();
	}

	protected goBack(): void {
		this._location.back();
	}

	protected getStatusLabel(status: number): string {
		return STATUS_LABELS[status] ?? 'Unknown';
	}

	protected getStatusClass(status: number): string {
		return STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-700';
	}

	protected onStatusChange(newStatus: number): void {
		const branchId = this.branch()?.id;
		if (!branchId || newStatus === this.branch()?.branchStatus) return;

		this.isUpdatingStatus.set(true);
		this._branchApi.updateBranchStatus(branchId, newStatus).subscribe({
			next: () => {
				this.isUpdatingStatus.set(false);
				this._messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: `Status changed to ${STATUS_LABELS[newStatus]}`,
				});
				this._loadBranch(branchId);
			},
			error: () => {
				this.isUpdatingStatus.set(false);
				this._messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to update status',
				});
			},
		});
	}

	protected openPhoneDialog(): void {
		const current = this.branch()?.phoneNumbers ?? [];
		this.phoneNumbers.set([...current]);
		this.newPhoneNumber.set('');
		this.phoneError.set('');
		this.isPhoneDialogVisible.set(true);
	}

	protected addPhoneNumber(): void {
		const number = this.newPhoneNumber().trim();
		if (!number) {
			this.phoneError.set('Phone number cannot be empty.');
			return;
		}
		if (!number.startsWith('+')) {
			this.phoneError.set('Phone number must start with + for the country code.');
			return;
		}
		if (!PHONE_REGEX.test(number)) {
			this.phoneError.set('Invalid phone number format. Example: +1234567890');
			return;
		}
		this.phoneError.set('');
		this.phoneNumbers.update((prev) => [...prev, number]);
		this.newPhoneNumber.set('');
	}

	protected removePhoneNumber(index: number): void {
		this.phoneNumbers.update((prev) => prev.filter((unused, i) => i !== index));
	}

	protected updatePhoneNumber(index: number, value: string): void {
		this.phoneNumbers.update((prev) => prev.map((item, i) => i === index ? value : item));
	}

	protected savePhoneNumbers(): void {
		const branchId = this.branch()?.id;
		if (!branchId) return;

		const validNumbers = this.phoneNumbers().map((n) => n.trim()).filter((n) => n.length > 0);
		const invalidNumber = validNumbers.find((n) => !PHONE_REGEX.test(n));
		if (invalidNumber) {
			this._messageService.add({
				severity: 'error',
				summary: 'Invalid Phone Number',
				detail: `"${invalidNumber}" is not a valid phone number.`,
			});
			return;
		}

		this.isSaving.set(true);
		this._branchApi.updatePhoneNumbers(branchId, validNumbers).subscribe({
			next: () => {
				this.isSaving.set(false);
				this.isPhoneDialogVisible.set(false);
				this._messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Phone numbers updated successfully',
				});
				this._loadBranch(branchId);
			},
			error: () => {
				this.isSaving.set(false);
				this._messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to update phone numbers',
				});
			},
		});
	}

	private _initMap(): void {
		const branch = this.branch();
		if (!branch) return;

		const lat = Number(branch.location.latitude);
		const lng = Number(branch.location.longitude);

		if (Number.isNaN(lat) || Number.isNaN(lng)) return;

		this._destroyMap();

		const container = this._mapContainer().nativeElement;

		this._map = L.map(container, {
			center: [lat, lng],
			zoom: 15,
			scrollWheelZoom: false,
			dragging: true,
		});

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		}).addTo(this._map);

		const customIcon = L.divIcon({
			className: 'branch-map-marker',
			html: `<svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 44 16 44C16 44 32 28 32 16C32 7.163 24.837 0 16 0Z" fill="#6056F0"/>
				<circle cx="16" cy="16" r="7" fill="white"/>
			</svg>`,
			iconSize: [32, 44],
			iconAnchor: [16, 44],
			popupAnchor: [0, -44],
		});

		L.marker([lat, lng], { icon: customIcon }).addTo(this._map);

		// Force resize after dialog/layout settles
		setTimeout(() => {
			this._map?.invalidateSize();
		}, 100);
	}

	private _destroyMap(): void {
		if (this._map) {
			this._map.remove();
			this._map = null;
		}
	}

	private _loadBranch(id: string): void {
		this.isLoading.set(true);
		this._branchApi.getBranchById(id).subscribe({
			next: (branch) => {
				this.branch.set(branch);
				this.isLoading.set(false);
				// Init map after branch data is available
				setTimeout(() => this._initMap());
			},
			error: () => {
				this.error.set('Failed to load branch details');
				this.isLoading.set(false);
			},
		});
	}
}
