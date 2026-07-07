export interface MarketingCredentialsStatus {
	connected: boolean;
	pageId: string | null;
}

export interface MarketingChat {
	id: string;
	title: string | null;
	status: 'Draft' | 'Archived' | 'Published';
	facebookPostId: string | null;
	createdAtUtc: string;
	updatedAtUtc: string;
}

export interface MarketingChatMessage {
	id: string;
	role: string;
	source: string;
	content: string;
	detectedIntent: string | null;
	createdAtUtc: string;
}

export interface MarketingChatDetail {
	id: string;
	status: string;
	title: string | null;
	facebookPostId: string | null;
	postMessage: string | null;
	postLink: string | null;
	hasImage: boolean;
	createdAtUtc: string;
	updatedAtUtc: string;
	messages: MarketingChatMessage[];
}

export interface CreateChatResponse {
	chatId: string;
	firstReply: {
		chatId: string;
		status: string;
		reply: string;
		detectedIntent: string;
		facebookPostId: string | null;
		contentPending: boolean;
	};
}

export interface PollContentResponse {
	chatId: string;
	status: string;
	content: string | null;
}

export interface SendMessageResponse {
	chatId: string;
	status: string;
	reply: string;
	detectedIntent: string;
	facebookPostId: string | null;
	contentPending: boolean;
}

export interface LocalChatMessage {
	id: string;
	role: 'User' | 'Assistant';
	content: string;
	createdAtUtc: string;
}

export interface ChatImage {
	content: string;
	contentType: string;
	fileName: string;
}
