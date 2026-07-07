import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WalletApiResponse } from '../dtos/wallet.dto';

export interface CheckoutRequest {
	amount: string;
	currency: string;
	recipientName: string;
	recipientBank: string;
	recipientNumber: string;
}

@Injectable({ providedIn: 'root' })
export class WalletApi {
	private readonly _http = inject(HttpClient);

	public getBranchWallet(branchId: string): Observable<WalletApiResponse> {
		return this._http.get<WalletApiResponse>(
			`${environment.apiBaseUrl}/wallets/branch/${branchId}`,
		);
	}

	public createBranchWallet(branchId: string): Observable<unknown> {
		return this._http.post(`${environment.apiBaseUrl}/wallets/branch/${branchId}`, {});
	}

	public checkout(branchId: string, request: CheckoutRequest): Observable<unknown> {
		return this._http.post(`${environment.apiBaseUrl}/wallets/branch/${branchId}/checkout`, request);
	}
}
