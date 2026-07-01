export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	userId: string;
	accessToken: string;
	refreshToken: string;
	roles: string[];
	permissions: string[];
}
