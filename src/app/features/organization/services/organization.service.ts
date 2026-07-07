import { inject, Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { debounceTime, distinctUntilChanged, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { OrganizationProfileApi } from '../apis/organization.api';
import { OrganizationStore } from '../store/organization.store';
import { UpdateOrganizationRequest } from '../apis/dtos/update-organization-profile-request.dto';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
	private readonly _api = inject(OrganizationProfileApi);
	private readonly _store = inject(OrganizationStore);
	private readonly _sanitizer = inject(DomSanitizer);

	private readonly _subDomainCheck$ = new Subject<{ value: string; currentSubDomain: string }>();

	public constructor() {
		// real-time subdomain check with debounce
		this._subDomainCheck$.pipe(
			debounceTime(500),
			distinctUntilChanged((a, b) => a.value === b.value),
			switchMap(({ value, currentSubDomain }) => {
				if (!value || value === currentSubDomain) {
					this._store.setSubDomainAvailable(true);
					return [];
				}
				this._store.setCheckingSubDomain(true);
				return this._api.checkSubDomainExists(value).pipe(
					tap((exists) => this._store.setSubDomainAvailable(!exists)),
				);
			}),
		).subscribe();
	}

	public loadOrganization(id: string): Observable<void> {
		this._store.setLoading();
		return this._api.getOrganization(id).pipe(
			tap((org) => {
				this._store.setOrganization(org);
				// console.log('Calling loadLogo...');
				this.loadLogo(id);
			}),
			tap({ error: (err: { message?: string }) => this._store.setError(err?.message ?? 'Failed to load organization') }),
			map(() => void 0),
		);
	}

	public loadLogo(id: string): void {
		// console.log('loadLogo called', id);
		this._api.getLogo(id).subscribe({
			next: (blob) => {
				const url = URL.createObjectURL(blob);
				// console.log(url);
				this._store.setLogoUrl(url);
			},
			error: () => {
				// console.log(err);
				this._store.setLogoUrl(null);
			},
		});
	}

	public uploadLogo(id: string, file: File): void {
		this._store.setUploadingLogo(true);
		this._api.uploadLogo(id, file).subscribe({
			next: () => {
				setTimeout(() => {
					this.loadLogo(id);
				}, 300);
			},
			error: (err: { error?: { error: string } }) => { this._store.setError(err?.error?.error ?? 'Failed to upload logo'); },
		});
	}

	public updateOrganization(id: string, request: UpdateOrganizationRequest): Observable<void> {
		this._store.setSaving(true);
		return this._api.updateOrganization(id, request).pipe(
			tap(() => this._store.setSaveSuccess()),
			tap({ error: (err: { error?: { error: string } }) => { this._store.setError(err?.error?.error ?? 'Failed to save');} }),
			map(() => void 0),
		);
	}

	public checkSubDomain(value: string, currentSubDomain: string): void {
		this._subDomainCheck$.next({ value, currentSubDomain });
	}

	public getservicesProvided(): Observable<string[]> {
		return this._api.getservicesProvided();
	}
}