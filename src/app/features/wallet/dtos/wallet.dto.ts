import { Wallet, WalletTransaction, TransactionType, TransactionPurpose } from '../models/wallet.model';

export interface WalletApiResponse {
	walletId: string;
	walletType: string;
	balance: string;
	currency: string;
	transactions: WalletTransactionApiResponse[];
}

export interface WalletTransactionApiResponse {
	id: string;
	type: string;
	purpose: string;
	amount: string;
	currency: string;
	runningBalance: string;
	description: string;
	referenceId: string;
	createdAtUtc: string;
}

export function mapApiResponseToWallet(response: WalletApiResponse): Wallet {
	return {
		walletId: response.walletId,
		walletType: mapWalletType(response.walletType),
		balance: response.balance,
		currency: response.currency,
		transactions: response.transactions.map(mapApiResponseToTransaction),
	};
}

function mapWalletType(type: string): 'Branch' | 'Customer' {
	if (type === 'Customer') return 'Customer';
	return 'Branch';
}

function mapApiResponseToTransaction(tx: WalletTransactionApiResponse): WalletTransaction {
	return {
		id: tx.id,
		type: mapTransactionType(tx.type),
		purpose: mapTransactionPurpose(tx.purpose),
		amount: tx.amount,
		currency: tx.currency,
		runningBalance: tx.runningBalance,
		description: tx.description,
		referenceId: tx.referenceId,
		createdAtUtc: tx.createdAtUtc,
	};
}

function mapTransactionType(type: string): TransactionType {
	return type === 'Debit' ? 'Debit' : 'Credit';
}

function mapTransactionPurpose(purpose: string): TransactionPurpose {
	const validPurposes: TransactionPurpose[] = ['Checkout', 'Recharge', 'Payout', 'Refund', 'Payment'];
	if (validPurposes.includes(purpose as TransactionPurpose)) {
		return purpose as TransactionPurpose;
	}
	return 'Payment';
}
