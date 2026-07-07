import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { MarketingApi } from '../apis/marketing.api';
import {
	CreateChatResponse,
	MarketingChat,
	MarketingChatDetail,
	MarketingCredentialsStatus,
	PollContentResponse,
	SendMessageResponse,
} from '../models/marketing.models';

export interface MarketingState {
	credentialsStatus: MarketingCredentialsStatus | null;
	chats: MarketingChat[];
	selectedChat: MarketingChatDetail | null;
	isLoadingCredentials: boolean;
	isLoadingChats: boolean;
	isLoadingChat: boolean;
	isCreatingChat: boolean;
	error: string | null;
}

const initialState: MarketingState = {
	credentialsStatus: null,
	chats: [],
	selectedChat: null,
	isLoadingCredentials: false,
	isLoadingChats: false,
	isLoadingChat: false,
	isCreatingChat: false,
	error: null,
};

export const MarketingStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withMethods((store) => {
		const api = inject(MarketingApi);
		return {
			async loadCredentialsStatus(): Promise<void> {
				patchState(store, { isLoadingCredentials: true, error: null });
				try {
					const status = await firstValueFrom(api.getCredentialsStatus());
					patchState(store, { credentialsStatus: status, isLoadingCredentials: false });
				} catch {
					patchState(store, {
						error: 'Failed to load credentials status',
						isLoadingCredentials: false,
					});
				}
			},
			async connectFacebook(authCode: string, pageId: string): Promise<boolean> {
				patchState(store, { isLoadingCredentials: true, error: null });
				try {
					await firstValueFrom(api.connectCredentials({ authCode, pageId }));
					const status = await firstValueFrom(api.getCredentialsStatus());
					patchState(store, { credentialsStatus: status, isLoadingCredentials: false });
					return true;
				} catch {
					patchState(store, { error: 'Failed to connect Facebook', isLoadingCredentials: false });
					return false;
				}
			},
			async disconnectFacebook(): Promise<boolean> {
				patchState(store, { isLoadingCredentials: true, error: null });
				try {
					await firstValueFrom(api.disconnectCredentials());
					patchState(store, {
						credentialsStatus: { connected: false, pageId: null },
						isLoadingCredentials: false,
					});
					return true;
				} catch {
					patchState(store, { error: 'Failed to disconnect', isLoadingCredentials: false });
					return false;
				}
			},
			async loadChats(): Promise<void> {
				patchState(store, { isLoadingChats: true, error: null });
				try {
					const chats = await firstValueFrom(api.getChats());
					patchState(store, { chats, isLoadingChats: false });
				} catch {
					patchState(store, { error: 'Failed to load chats', isLoadingChats: false });
				}
			},
			async loadChat(chatId: string): Promise<void> {
				patchState(store, { isLoadingChat: true, error: null });
				try {
					const selectedChat = await firstValueFrom(api.getChatById(chatId));
					patchState(store, { selectedChat, isLoadingChat: false });
				} catch {
					patchState(store, { error: 'Failed to load chat', isLoadingChat: false });
				}
			},
			clearSelectedChat(): void {
				patchState(store, { selectedChat: null });
			},
			async createChat(firstMessage: string): Promise<CreateChatResponse | null> {
				patchState(store, { isCreatingChat: true, error: null });
				try {
					const response = await firstValueFrom(api.createChat(firstMessage));
					patchState(store, { isCreatingChat: false });
					return response;
				} catch {
					patchState(store, { error: 'Failed to create chat', isCreatingChat: false });
					return null;
				}
			},
			async pollContent(chatId: string): Promise<PollContentResponse | null> {
				try {
					return await firstValueFrom(api.pollContent(chatId));
				} catch {
					return null;
				}
			},
			async sendMessage(chatId: string, message: string): Promise<SendMessageResponse | null> {
				try {
					return await firstValueFrom(api.sendMessage(chatId, message));
				} catch {
					return null;
				}
			},
		};
	}),
);
