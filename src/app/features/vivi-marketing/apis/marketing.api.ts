import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
	CreateChatResponse,
	MarketingChat,
	MarketingChatDetail,
	MarketingCredentialsStatus,
	PollContentResponse,
	SendMessageResponse,
} from '../models/marketing.models';

interface ConnectRequest {
	authCode: string;
	pageId: string;
}

@Injectable({ providedIn: 'root' })
export class MarketingApi {
	private readonly _http = inject(HttpClient);

	public getCredentialsStatus(): Observable<MarketingCredentialsStatus> {
		return this._http.get<MarketingCredentialsStatus>(
			`${environment.apiBaseUrl}/marketing/meta-credentials/status`,
		);
	}

	public connectCredentials(request: ConnectRequest): Observable<void> {
		return this._http.post<void>(
			`${environment.apiBaseUrl}/marketing/meta-credentials/connect`,
			request,
		);
	}

	public disconnectCredentials(): Observable<void> {
		return this._http.delete<void>(`${environment.apiBaseUrl}/marketing/meta-credentials`);
	}

	public getChats(): Observable<MarketingChat[]> {
		return this._http.get<MarketingChat[]>(`${environment.apiBaseUrl}/marketing/chats`);
	}

	public getChatById(chatId: string): Observable<MarketingChatDetail> {
		return this._http.get<MarketingChatDetail>(
			`${environment.apiBaseUrl}/marketing/chats/${chatId}`,
		);
	}

	public createChat(firstMessage: string): Observable<CreateChatResponse> {
		return this._http.post<CreateChatResponse>(`${environment.apiBaseUrl}/marketing/chats`, {
			firstMessage,
		});
	}

	public pollContent(chatId: string): Observable<PollContentResponse> {
		return this._http.post<PollContentResponse>(
			`${environment.apiBaseUrl}/marketing/chats/${chatId}/poll-content`,
			{},
		);
	}

	public sendMessage(chatId: string, message: string): Observable<SendMessageResponse> {
		return this._http.post<SendMessageResponse>(
			`${environment.apiBaseUrl}/marketing/chats/${chatId}/messages`,
			{ message },
		);
	}

	public getChatImage(chatId: string): Observable<HttpResponse<Blob>> {
		return this._http.get(`${environment.apiBaseUrl}/marketing/chats/${chatId}/image`, {
			observe: 'response',
			responseType: 'blob',
		});
	}

	public publishChat(chatId: string): Observable<void> {
		return this._http.post<void>(`${environment.apiBaseUrl}/marketing/chats/${chatId}/publish`, {});
	}
}
