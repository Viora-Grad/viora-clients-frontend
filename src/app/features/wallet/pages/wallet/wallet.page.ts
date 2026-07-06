import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BranchStore } from '../../../../core/branch/stores/branch.store';
import { WalletApi } from '../../apis/wallet.api';
import { mapApiResponseToWallet } from '../../dtos/wallet.dto';
import { Wallet, WalletTransaction, TransactionType, TransactionPurpose } from '../../models/wallet.model';

const PURPOSE_SEVERITY: Record<TransactionPurpose, 'success' | 'warn' | 'danger' | 'secondary' | 'info'> = {
	'Checkout': 'info',
	'Recharge': 'success',
	'Payout': 'warn',
	'Refund': 'danger',
	'Payment': 'secondary',
};

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-wallet',
	imports: [Button, Dialog, InputText, ReactiveFormsModule, Tag, Toast],
	providers: [MessageService],
	styleUrl: './wallet.page.css',
	templateUrl: './wallet.page.html',
})
export class WalletPage implements OnInit {
	private readonly _branchStore = inject(BranchStore);
	private readonly _walletApi = inject(WalletApi);
	private readonly _messageService = inject(MessageService);
	private readonly _formBuilder = inject(NonNullableFormBuilder);

	protected readonly wallet = signal<Wallet | null>(null);
	protected readonly isLoading = signal(true);
	protected readonly error = signal<string | null>(null);
	protected readonly noWallet = signal(false);
	protected readonly isCreating = signal(false);
	protected readonly isCheckoutDialogVisible = signal(false);
	protected readonly isCheckingOut = signal(false);

	protected readonly checkoutForm = this._formBuilder.group({
		amount: ['', [Validators.required, Validators.min(0.01)]],
		recipientName: ['', Validators.required],
		recipientBank: ['', Validators.required],
		recipientNumber: ['', Validators.required],
	});

	protected readonly formattedBalance = computed(() => {
		const w = this.wallet();
		if (!w) return '0.00';
		const amount = parseFloat(w.balance);
		if (Number.isNaN(amount)) return w.balance;
		return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	});

	protected readonly totalCredit = computed(() => {
		const w = this.wallet();
		if (!w) return '0.00';
		const total = w.transactions
			.filter((tx) => tx.type === 'Credit')
			.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
		return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	});

	protected readonly totalDebit = computed(() => {
		const w = this.wallet();
		if (!w) return '0.00';
		const total = w.transactions
			.filter((tx) => tx.type === 'Debit')
			.reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);
		return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	});

	protected readonly transactionCount = computed(() => this.wallet()?.transactions.length ?? 0);

	public ngOnInit(): void {
		const branchId = this._branchStore.currentBranchId();
		if (!branchId) {
			this.error.set('No branch selected');
			this.isLoading.set(false);
			return;
		}
		this._loadWallet(branchId);
	}

	protected getTypeSeverity(type: TransactionType): 'success' | 'danger' {
		return type === 'Credit' ? 'success' : 'danger';
	}

	protected getPurposeSeverity(purpose: TransactionPurpose): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
		return PURPOSE_SEVERITY[purpose] ?? 'secondary';
	}

	protected getAmountDisplay(tx: WalletTransaction): string {
		const amount = parseFloat(tx.amount);
		if (Number.isNaN(amount)) return tx.amount;
		const formatted = Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		return tx.type === 'Credit' ? `+${formatted}` : `-${formatted}`;
	}

	protected getAmountClass(tx: WalletTransaction): string {
		return tx.type === 'Credit' ? 'text-emerald-600' : 'text-red-600';
	}

	protected formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	protected formatTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	protected formatRunningBalance(tx: WalletTransaction): string {
		const amount = parseFloat(tx.runningBalance);
		if (Number.isNaN(amount)) return tx.runningBalance;
		return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	protected createWallet(): void {
		const branchId = this._branchStore.currentBranchId();
		if (!branchId) return;

		this.isCreating.set(true);
		this._walletApi.createBranchWallet(branchId).subscribe({
			next: () => {
				this.noWallet.set(false);
				this._loadWallet(branchId);
				this.isCreating.set(false);
				this._messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Wallet created successfully',
				});
			},
			error: () => {
				this.isCreating.set(false);
				this._messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to create wallet',
				});
			},
		});
	}

	protected openCheckoutDialog(): void {
		this.checkoutForm.reset();
		this.isCheckoutDialogVisible.set(true);
	}

	protected submitCheckout(): void {
		if (this.checkoutForm.invalid) return;

		const branchId = this._branchStore.currentBranchId();
		const w = this.wallet();
		if (!branchId || !w) return;

		const { amount, recipientName, recipientBank, recipientNumber } = this.checkoutForm.getRawValue();

		this.isCheckingOut.set(true);
		this._walletApi.checkout(branchId, {
			amount,
			currency: w.currency,
			recipientName,
			recipientBank,
			recipientNumber,
		}).subscribe({
			next: () => {
				this.isCheckingOut.set(false);
				this.isCheckoutDialogVisible.set(false);
				this._messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Checkout completed successfully',
				});
				this._loadWallet(branchId);
			},
			error: (err: unknown) => {
				this.isCheckingOut.set(false);
				const message = err instanceof HttpErrorResponse && err.status === 400
					? 'Insufficient balance'
					: 'Checkout failed';
				this._messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: message,
				});
			},
		});
	}

	protected trackByTransactionId(_index: number, tx: WalletTransaction): string {
		return tx.id;
	}

	private _loadWallet(branchId: string): void {
		this.isLoading.set(true);
		this.noWallet.set(false);
		this._walletApi.getBranchWallet(branchId).subscribe({
			next: (response) => {
				this.wallet.set(mapApiResponseToWallet(response));
				this.isLoading.set(false);
			},
			error: () => {
				this.noWallet.set(true);
				this.isLoading.set(false);
			},
		});
	}
}
