export interface Wallet {
	walletId: string;
	walletType: 'Branch' | 'Customer';
	balance: string;
	currency: string;
	transactions: WalletTransaction[];
}

export interface WalletTransaction {
	id: string;
	type: TransactionType;
	purpose: TransactionPurpose;
	amount: string;
	currency: string;
	runningBalance: string;
	description: string;
	referenceId: string;
	createdAtUtc: string;
}

export type TransactionType = 'Credit' | 'Debit';

export type TransactionPurpose = 'Checkout' | 'Recharge' | 'Payout' | 'Refund' | 'Payment';
