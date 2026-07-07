import { DatePipe } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
	OnInit,
	signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { FacebookService } from '../../../../core/facebook/services/facebook.service';
import { ChatDetailComponent } from '../../components/chat-detail/chat-detail.component';
import { LocalChatMessage } from '../../models/marketing.models';
import { MarketingStore } from '../../stores/marketing.store';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-vivi-marketing',
	imports: [Button, Dialog, Toast, DatePipe, ChatDetailComponent, FormsModule],
	providers: [MessageService],
	templateUrl: './vivi-marketing.page.html',
	styleUrl: './vivi-marketing.page.css',
})
export class ViviMarketingPage implements OnInit {
	protected readonly marketingStore = inject(MarketingStore);
	private readonly _facebookService = inject(FacebookService);
	private readonly _messageService = inject(MessageService);
	private readonly _destroyRef = inject(DestroyRef);

	protected readonly selectedChatId = signal<string | null>(null);
	protected readonly showDisconnectDialog = signal(false);
	protected readonly isConnecting = signal(false);
	protected readonly newChatMessage = signal('');
	protected readonly isPolling = signal(false);
	protected readonly chatMessages = signal<LocalChatMessage[]>([]);

	protected readonly displayMessages = computed(() => {
		const local = this.chatMessages();
		if (local.length > 0) return local;
		const apiMessages = this.marketingStore.selectedChat()?.messages;
		if (!apiMessages) return [];
		return apiMessages.map((m) => ({
			id: m.id,
			role: m.role as 'User' | 'Assistant',
			content: m.content,
			createdAtUtc: m.createdAtUtc,
		}));
	});

	private _pollInterval: ReturnType<typeof setInterval> | null = null;

	public ngOnInit(): void {
		void this.marketingStore.loadCredentialsStatus();
		void this.marketingStore.loadChats();
	}

	protected get isConnected(): boolean {
		return this.marketingStore.credentialsStatus()?.connected ?? false;
	}

	protected async onConnectFacebook(): Promise<void> {
		this.isConnecting.set(true);
		try {
			await this._facebookService.initSdk();
			const userToken = await this._facebookService.login();
			const pages = await this._facebookService.getPages(userToken);

			if (pages.length === 0) {
				this._messageService.add({
					severity: 'warn',
					summary: 'No Pages',
					detail: 'No Facebook pages found on your account.',
				});
				this.isConnecting.set(false);
				return;
			}

			const firstPage = pages[0];
			const success = await this.marketingStore.connectFacebook(userToken, firstPage.id);
			if (success) {
				this._messageService.add({
					severity: 'success',
					summary: 'Connected',
					detail: `Connected to "${firstPage.name}" successfully.`,
				});
			} else {
				this._messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: this.marketingStore.error() ?? 'Failed to connect.',
				});
			}
		} catch {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Facebook login was cancelled or failed.',
			});
		} finally {
			this.isConnecting.set(false);
		}
	}

	protected onDisconnectConfirm(): void {
		void this.marketingStore.disconnectFacebook().then((success) => {
			if (success) {
				this._messageService.add({
					severity: 'success',
					summary: 'Disconnected',
					detail: 'Facebook connection removed.',
				});
			} else {
				this._messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: this.marketingStore.error() ?? 'Failed to disconnect.',
				});
			}
			this.showDisconnectDialog.set(false);
		});
	}

	protected async onCreateChat(): Promise<void> {
		const message = this.newChatMessage().trim();
		if (!message) return;

		const response = await this.marketingStore.createChat(message);
		if (!response) {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: this.marketingStore.error() ?? 'Failed to create chat.',
			});
			return;
		}

		this.newChatMessage.set('');
		this.selectedChatId.set(response.chatId);

		const now = new Date().toISOString();
		const userMsg: LocalChatMessage = {
			id: crypto.randomUUID(),
			role: 'User',
			content: message,
			createdAtUtc: now,
		};

		const assistantMsg: LocalChatMessage = {
			id: crypto.randomUUID(),
			role: 'Assistant',
			content: response.firstReply.reply,
			createdAtUtc: now,
		};

		this.chatMessages.set([userMsg, assistantMsg]);
		this._startPolling(response.chatId);
	}

	protected onChatClick(chatId: string): void {
		this.selectedChatId.set(chatId);
		this.chatMessages.set([]);
		void this.marketingStore.loadChat(chatId);
	}

	protected async onSendMessage(message: string): Promise<void> {
		const chatId = this.selectedChatId();
		if (!chatId || !message.trim()) return;

		const now = new Date().toISOString();
		const userMsg: LocalChatMessage = {
			id: crypto.randomUUID(),
			role: 'User',
			content: message,
			createdAtUtc: now,
		};
		this.chatMessages.update((msgs) => [...msgs, userMsg]);

		await this.marketingStore.sendMessage(chatId, message);
		this._startPolling(chatId);
	}

	protected async onPublished(): Promise<void> {
		this._messageService.add({
			severity: 'success',
			summary: 'Published',
			detail: 'Your post has been published to Facebook.',
		});
		const chatId = this.selectedChatId();
		if (chatId) await this.marketingStore.loadChat(chatId);
		await this.marketingStore.loadChats();
	}

	protected onBack(): void {
		this._stopPolling();
		this.selectedChatId.set(null);
		this.chatMessages.set([]);
		this.marketingStore.clearSelectedChat();
	}

	protected getStatusClass(status: string | undefined): string {
		switch (status) {
			case 'Draft':
				return 'bg-yellow-100 text-yellow-700';
			case 'Published':
				return 'bg-green-100 text-green-700';
			case 'Archived':
				return 'bg-gray-100 text-gray-500';
			default:
				return 'bg-gray-100 text-gray-500';
		}
	}

	private _startPolling(chatId: string): void {
		this._stopPolling();
		this.isPolling.set(true);

		this._pollInterval = setInterval(async () => {
			const result = await this.marketingStore.pollContent(chatId);
			if (result?.status === 'Ready') {
				this._stopPolling();
				this.chatMessages.set([]);
				await this.marketingStore.loadChat(chatId);
			}
		}, 2000);

		this._destroyRef.onDestroy(() => this._stopPolling());
	}

	private _stopPolling(): void {
		if (this._pollInterval) {
			clearInterval(this._pollInterval);
			this._pollInterval = null;
		}
		this.isPolling.set(false);
	}
}
