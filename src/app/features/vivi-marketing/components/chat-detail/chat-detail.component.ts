import { DatePipe } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	effect,
	inject,
	input,
	output,
	signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { MarketingApi } from '../../apis/marketing.api';
import { ChatImage, LocalChatMessage, MarketingChatDetail } from '../../models/marketing.models';

interface LoadedImage {
	url: string;
	fileName: string;
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-chat-detail',
	imports: [Button, DatePipe, FormsModule, Dialog],
	templateUrl: './chat-detail.component.html',
	styleUrl: './chat-detail.component.css',
})
export class ChatDetailComponent {
	private readonly _api = inject(MarketingApi);
	private readonly _destroyRef = inject(DestroyRef);

	public readonly chat = input<MarketingChatDetail | null>(null);
	public readonly messages = input<LocalChatMessage[]>([]);
	public readonly isConnected = input<boolean>(false);
	public readonly isPolling = input<boolean>(false);

	public readonly back = output<void>();
	public readonly sendMessage = output<string>();
	public readonly published = output<void>();

	protected readonly messageInput = signal('');
	protected readonly showImageDialog = signal(false);
	protected readonly chatImage = signal<LoadedImage | null>(null);

	protected readonly showPostDialog = signal(false);
	protected readonly isPublishing = signal(false);
	protected readonly publishError = signal<string | null>(null);

	protected readonly postContent = computed(() => this.chat()?.postMessage ?? null);

	/** Archived/Published chats are read-only: no new messages, view the post instead. */
	protected readonly isReadOnly = computed(() => {
		const status = this.chat()?.status;
		return status === 'Archived' || status === 'Published';
	});

	protected readonly isPublished = computed(() => this.chat()?.status === 'Published');

	/** id of the last non-user (assistant) message, used to anchor the attachment button */
	protected readonly lastAssistantId = computed(() => {
		const msgs = this.messages();
		for (let i = msgs.length - 1; i >= 0; i--) {
			if (msgs[i].role !== 'User') return msgs[i].id;
		}
		return null;
	});

	protected readonly imageDataUrl = computed(() => this.chatImage()?.url ?? null);

	private _loadedImageChatId: string | null = null;
	private _objectUrl: string | null = null;

	private _publishErrorChatId: string | null = null;

	public constructor() {
		effect(() => {
			const chat = this.chat();

			// Clear any stale publish error when switching to a different chat.
			if (chat?.id !== this._publishErrorChatId) {
				this._publishErrorChatId = chat?.id ?? null;
				this.publishError.set(null);
			}

			if (!chat?.hasImage) {
				this._setImage(null);
				this._loadedImageChatId = null;
				return;
			}

			if (chat.id === this._loadedImageChatId) return;
			this._loadedImageChatId = chat.id;

			this._api
				.getChatImage(chat.id)
				.pipe(takeUntilDestroyed(this._destroyRef))
				.subscribe({
					next: (response) => void this._handleImageResponse(response),
					error: (err) => {
						console.error('[chat-detail] failed to load chat image', err);
						this._setImage(null);
						this._loadedImageChatId = null;
					},
				});
		});

		this._destroyRef.onDestroy(() => this._revokeObjectUrl());
	}

	protected onSend(): void {
		const message = this.messageInput().trim();
		if (!message || this.isPolling()) return;
		this.sendMessage.emit(message);
		this.messageInput.set('');
	}

	protected openPost(): void {
		if (!this.chat()) return;
		this.publishError.set(null);
		this.showPostDialog.set(true);
	}

	protected onPublish(): void {
		const chat = this.chat();
		if (!chat || this.isPublishing()) return;

		this.isPublishing.set(true);
		this.publishError.set(null);
		this._api
			.publishChat(chat.id)
			.pipe(takeUntilDestroyed(this._destroyRef))
			.subscribe({
				next: () => {
					this.isPublishing.set(false);
					this.showPostDialog.set(false);
					this.published.emit();
				},
				error: (err) => {
					console.error('[chat-detail] failed to publish chat', err);
					this.isPublishing.set(false);
					this.publishError.set('Failed to publish the post. Please try again.');
				},
			});
	}

	private async _handleImageResponse(response: HttpResponse<Blob>): Promise<void> {
		const blob = response.body;
		const headerContentType = response.headers.get('content-type');
		console.log('[chat-detail] image response received', {
			blobType: blob?.type,
			blobSize: blob?.size,
			headerContentType,
		});

		if (!blob || blob.size === 0) {
			this._setImage(null);
			return;
		}

		const contentType = blob.type !== '' ? blob.type : (headerContentType ?? '');

		// Backend may return the documented JSON envelope ({ content, contentType, fileName })
		// or the raw image bytes. Handle both.
		if (contentType.includes('json') || contentType.includes('text')) {
			await this._handleJsonImage(blob);
		} else {
			const url = URL.createObjectURL(blob);
			const fileName =
				this._fileNameFromDisposition(response.headers.get('content-disposition')) ??
				`attachment.${this._extensionFromType(contentType)}`;
			this._setImage({ url, fileName });
		}

		console.log('[chat-detail] chatImage signal is now', this.chatImage());
	}

	private async _handleJsonImage(blob: Blob): Promise<void> {
		try {
			const parsed = JSON.parse(await blob.text()) as ChatImage;
			const url = parsed.content.startsWith('data:')
				? parsed.content
				: `data:${parsed.contentType};base64,${parsed.content}`;
			this._setImage({ url, fileName: parsed.fileName ?? 'attachment' });
		} catch (err) {
			console.error('[chat-detail] failed to parse image JSON', err);
			this._setImage(null);
		}
	}

	private _setImage(image: LoadedImage | null): void {
		this._revokeObjectUrl();
		if (image?.url.startsWith('blob:')) this._objectUrl = image.url;
		this.chatImage.set(image);
	}

	private _revokeObjectUrl(): void {
		if (this._objectUrl) {
			URL.revokeObjectURL(this._objectUrl);
			this._objectUrl = null;
		}
	}

	private _fileNameFromDisposition(disposition: string | null): string | null {
		if (!disposition) return null;
		const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition);
		return match ? decodeURIComponent(match[1]) : null;
	}

	private _extensionFromType(contentType: string): string {
		const subtype = contentType.split('/')[1]?.split(';')[0];
		return subtype || 'png';
	}
}
