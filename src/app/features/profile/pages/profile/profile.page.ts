import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../../core/auth/apis/auth.api';
import { StaffMeResponse, UserMeResponse } from '../../../../core/auth/dtos/me.dto';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AuthStore } from '../../../../core/auth/stores/auth.store';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-profile',
	imports: [Button, Tag, DatePipe, Button],
	templateUrl: './profile.page.html',
	styleUrl: './profile.page.css',
})
export class ProfilePage implements OnInit {
	private readonly _authApi = inject(AuthApi);
	private readonly _authStore = inject(AuthStore);
	private readonly _authService = inject(AuthService);

	protected readonly isLoading = signal(true);
	protected readonly staffData = signal<StaffMeResponse | null>(null);
	protected readonly userData = signal<UserMeResponse | null>(null);

	protected readonly isStaff = this._authStore.isStaff;

	protected readonly userInitials = (): string => {
		const user = this._authStore.currentUser();
		const first = user?.firstName?.charAt(0) ?? '';
		const last = user?.lastName?.charAt(0) ?? '';
		return (first + last).toUpperCase() || 'UN';
	};

	protected readonly userName = (): string => {
		const user = this._authStore.currentUser();
		const first = user?.firstName ?? '';
		const last = user?.lastName ?? '';
		return `${first} ${last}`.trim() || 'User Name';
	};

	protected readonly roleNames = (): string[] => {
		const data = this.staffData();
		if (!data) return [];
		return data.roles.map((r) => r.name);
	};

	protected readonly permissionNames = (): string[] => {
		const data = this.staffData();
		if (data) {
			const perms = new Set<string>();
			for (const role of data.roles) {
				for (const p of role.permissions) {
					perms.add(p.description ?? p.name);
				}
			}
			return [...perms];
		}
		const userPerms = this._authStore.currentUser()?.permissions ?? [];
		return userPerms;
	};

	public ngOnInit(): void {
		void this._loadProfile();
	}

	protected onLogout(): void {
		this._authService.logout();
	}

	private async _loadProfile(): Promise<void> {
		try {
			if (this._authStore.isStaff()) {
				const response = await firstValueFrom(this._authApi.getStaffMe());
				this.staffData.set(response);
			} else {
				const response = await firstValueFrom(this._authApi.getMe());
				this.userData.set(response);
			}
		} catch {
			// silently fail
		} finally {
			this.isLoading.set(false);
		}
	}
}
