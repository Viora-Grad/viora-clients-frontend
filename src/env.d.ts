/* eslint-disable @typescript-eslint/naming-convention */
interface ImportMetaEnv {
	readonly NG_APP_API_BASE_URL: string;
	readonly NG_APP_GOOGLE_CLIENT_ID: string;
	readonly NG_APP_GOOGLE_REDIRECT_URI: string;
	readonly NG_APP_FACEBOOK_APP_ID: string;
	readonly NG_APP_FACEBOOK_APP_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
