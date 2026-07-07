export interface UpdateOrganizationRequest {
	subDomain: string;
	supportEmail: string;
	billingEmail: string;
	serviceDescription: string;
	servicesProvided: string[];
	about: string;
}
