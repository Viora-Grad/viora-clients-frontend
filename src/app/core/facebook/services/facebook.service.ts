import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FacebookApi } from '../apis/facebook.api';

export interface FacebookPage {
	id: string;
	name: string;
	/* eslint-disable @typescript-eslint/naming-convention */
	access_token: string;
	/* eslint-enable @typescript-eslint/naming-convention */
	category: string;
}

@Injectable({ providedIn: 'root' })
export class FacebookService {
	private readonly _facebookApi = inject(FacebookApi);
	private _sdkLoaded = false;

	public initSdk(): Promise<void> {
		if (this._sdkLoaded) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
			(window as any).fbAsyncInit = () => {
				(window as any).FB.init({
					appId: environment.facebookAppId,
					cookie: true,
					xfbml: false,
					version: 'v21.0',
				});
				/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
				this._sdkLoaded = true;
				resolve();
			};

			const script = document.createElement('script');
			script.src = 'https://connect.facebook.net/en_US/sdk.js';
			script.async = true;
			script.defer = true;
			script.crossOrigin = 'anonymous';
			script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
			document.head.appendChild(script);
		});
	}

	public login(): Promise<string> {
		return new Promise((resolve, reject) => {
			/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
			(window as any).FB.login(
				(response: any) => {
					if (response.authResponse) {
						resolve(response.authResponse.accessToken);
					} else {
						reject(new Error('Facebook login was cancelled or failed.'));
					}
				},
				{
					scope:
						'business_management,pages_manage_posts,pages_read_user_content,pages_show_list,public_profile,pages_read_engagement',
				},
			);
			/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
		});
	}

	public getPages(accessToken: string): Promise<FacebookPage[]> {
		return new Promise((resolve, reject) => {
			/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/naming-convention, @typescript-eslint/no-unsafe-argument */
			(window as any).FB.api(
				'/me/accounts',
				'GET',
				{ access_token: accessToken },
				(response: any) => {
					if (response.error) {
						reject(new Error(response.error.message));
					} else {
						resolve(response.data as FacebookPage[]);
					}
				},
			);
			/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/naming-convention, @typescript-eslint/no-unsafe-argument */
		});
	}

	public async connectPage(pageId: string, userToken: string): Promise<void> {
		await firstValueFrom(this._facebookApi.connectPage({ pageId, userToken }));
	}
}
