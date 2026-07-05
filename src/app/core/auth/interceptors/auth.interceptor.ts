import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, filter, finalize, from, Subject, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';

const WHITELISTED_URLS = [
	'/auth/login',
	'/auth/refresh',
	'/auth/logout',
	'/auth/current-user',
	'/auth/google-login',
	'/staff/register',
	'/validate-username',
];

let isRefreshing = false;
const refreshTokenSubject = new Subject<boolean>();

function isWhitelisted(url: string): boolean {
	return WHITELISTED_URLS.some((pattern) => url.includes(pattern));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authStore = inject(AuthStore);
	const authService = inject(AuthService);
	const router = inject(Router);

	const accessToken = authStore.accessToken();

	if (isWhitelisted(req.url)) {
		return next(req);
	}

	if (!accessToken) {
		return next(req);
	}

	const authReq = req.clone({
		// eslint-disable-next-line @typescript-eslint/naming-convention
		setHeaders: { Authorization: `Bearer ${accessToken}` },
	});

	return next(authReq).pipe(
		catchError((error: HttpErrorResponse) => {
			if (error.status !== 401 && error.status !== 403) {
				return throwError(() => error);
			}

			if (isRefreshing) {
				return refreshTokenSubject.pipe(
					filter((success) => success),
					take(1),
					switchMap(() => {
						const newToken = authStore.accessToken();
						if (!newToken) {
							return throwError(() => error);
						}
						const retryReq = req.clone({
							// eslint-disable-next-line @typescript-eslint/naming-convention
							setHeaders: { Authorization: `Bearer ${newToken}` },
						});
						return next(retryReq);
					}),
				);
			}

			isRefreshing = true;
			refreshTokenSubject.next(false);

			return from(authService.refresh()).pipe(
				finalize(() => {
					isRefreshing = false;
					refreshTokenSubject.next(true);
				}),
				switchMap((success) => {
					if (success) {
						const newToken = authStore.accessToken();
						const retryReq = req.clone({
							// eslint-disable-next-line @typescript-eslint/naming-convention
							setHeaders: { Authorization: `Bearer ${newToken}` },
						});
						return next(retryReq);
					}

					void router.navigate(['/auth/login']);
					return throwError(() => error);
				}),
				catchError(() => {
					void router.navigate(['/auth/login']);
					return throwError(() => error);
				}),
			);
		}),
	);
};
