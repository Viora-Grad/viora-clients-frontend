/* eslint-disable @typescript-eslint/unbound-method */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';
import { AnalyticsApi } from '../../apis/analytics.api';
import { ShadowHtmlComponent } from '../../components/shadow-html.component';

interface GranularityOption {
	label: string;
	value: string;
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-home',
	imports: [ReactiveFormsModule, DatePicker, Select, Button, ShadowHtmlComponent],
	template: `
		<div class="flex flex-col h-full">
			<!-- Top Navbar -->
			<div class="flex items-center justify-between bg-white px-6 py-4 shadow-sm shrink-0">
				<h1 class="text-xl font-bold text-gray-900">Overview</h1>
			</div>

			<!-- Main Content -->
			<div class="flex-1 overflow-auto p-6">
				<!-- Filters Card -->
				<div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
					<form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex items-end gap-4 flex-wrap">
						<div class="flex flex-col gap-1.5">
							<label for="from" class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
								>From</label
							>
							<p-datepicker
								id="from"
								formControlName="from"
								dateFormat="yy-mm-dd"
								[showIcon]="true"
								placeholder="Select start date"
								styleClass="!w-auto"
								inputStyleClass="!text-sm"
							/>
						</div>

						<div class="flex flex-col gap-1.5">
							<label for="to" class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
								>To</label
							>
							<p-datepicker
								id="to"
								formControlName="to"
								dateFormat="yy-mm-dd"
								[showIcon]="true"
								placeholder="Select end date"
								styleClass="!w-auto"
								inputStyleClass="!text-sm"
							/>
						</div>

						<div class="flex flex-col gap-1.5">
							<label
								for="granularity"
								class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
								>Granularity</label
							>
							<p-select
								id="granularity"
								formControlName="granularity"
								[options]="granularityOptions"
								optionLabel="label"
								optionValue="value"
								placeholder="Select granularity"
								styleClass="!w-40"
							/>
						</div>

						<p-button
							label="Fetch Analytics"
							icon="pi pi-search"
							type="submit"
							[loading]="isLoading()"
							[disabled]="form.invalid"
							styleClass="!bg-primary !border-primary hover:!bg-primary-700"
						/>
					</form>
				</div>

				<!-- Analytics Content -->
				@if (isLoading()) {
					<div class="flex items-center justify-center py-20">
						<i class="pi pi-spin pi-spinner text-primary text-3xl"></i>
					</div>
				} @else if (rawHtml()) {
					<div class="bg-white rounded-2xl shadow-sm p-6">
						<app-shadow-html [html]="rawHtml()!" />
					</div>
				} @else {
					<div class="flex flex-col items-center justify-center py-20 text-center">
						<div class="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
							<i class="pi pi-chart-bar text-gray-400 text-2xl"></i>
						</div>
						<p class="text-gray-500 text-sm">
							Select a date range and granularity, then click Fetch Analytics.
						</p>
					</div>
				}
			</div>
		</div>
	`,
})
export class HomePage {
	private readonly _fb = inject(NonNullableFormBuilder);
	private readonly _analyticsApi = inject(AnalyticsApi);
	protected readonly tenantStore = inject(TenantStore);

	protected readonly isLoading = signal(false);
	protected readonly rawHtml = signal<string | null>(null);

	protected readonly granularityOptions: GranularityOption[] = [
		{ label: 'Day', value: 'Day' },
		{ label: 'Week', value: 'Week' },
		{ label: 'Month', value: 'Month' },
	];

	protected readonly form = this._fb.group({
		from: [this._getDefaultFromDate(), Validators.required],
		to: [this._getDefaultToDate(), Validators.required],
		granularity: ['Day', Validators.required],
	});

	protected onSubmit(): void {
		if (this.form.invalid) return;

		const { from, to, granularity } = this.form.getRawValue();
		const fromIso = this._toRfc3339(from);
		const toIso = this._toRfc3339(to);

		this.isLoading.set(true);
		this.rawHtml.set(null);

		this._analyticsApi.getDashboard(fromIso, toIso, granularity).subscribe({
			next: (html) => {
				this.rawHtml.set(html);
				this.isLoading.set(false);
			},
			error: () => {
				this.isLoading.set(false);
			},
		});
	}

	private _getDefaultFromDate(): Date {
		const joinedOnUtc = this.tenantStore.joinedOnUtc();
		if (joinedOnUtc) {
			return new Date(joinedOnUtc);
		}
		const date = new Date();
		date.setDate(date.getDate() - 30);
		return date;
	}

	private _getDefaultToDate(): Date {
		return new Date();
	}

	private _toRfc3339(date: Date): string {
		return date.toISOString();
	}
}
