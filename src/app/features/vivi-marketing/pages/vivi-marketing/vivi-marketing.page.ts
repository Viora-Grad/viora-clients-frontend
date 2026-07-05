import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FacebookStore } from '../../../../core/facebook/stores/facebook.store';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-vivi-marketing',
	imports: [ButtonModule, CardModule, ProgressSpinnerModule, ToastModule],
	providers: [MessageService],
	templateUrl: './vivi-marketing.page.html',
	styleUrl: './vivi-marketing.page.css',
})
export class ViviMarketingPage {
	protected readonly facebookStore = inject(FacebookStore);
	private readonly _messageService = inject(MessageService);

	protected async onConnectFacebook(): Promise<void> {
		await this.facebookStore.initAndLogin();
	}

	protected onPageSelect(pageId: string): void {
		this.facebookStore.selectPage(pageId);
	}

	protected async onConnectPage(): Promise<void> {
		const success = await this.facebookStore.connectSelectedPage();
		if (success) {
			this._messageService.add({
				severity: 'success',
				summary: 'Connected',
				detail: 'Facebook page connected successfully!',
			});
			this.facebookStore.reset();
		} else if (this.facebookStore.error()) {
			this._messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: this.facebookStore.error()!,
			});
		}
	}
}
