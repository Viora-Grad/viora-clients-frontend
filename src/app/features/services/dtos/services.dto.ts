export interface CreateServiceRequest {
	branchId: string;
	name: string;
	description: string;
	serviceType: string;
	durationInMinutes: string;
	costAmount: string;
	currency: string;
}

export interface UpdateServiceRequest {
	name: string;
	description: string;
	serviceType: string;
	durationInMinutes: string;
	costAmount: string;
	currency: string;
}

export interface AddDiscountRequest {
	discountOutOf100: string;
	reason: string;
	durationInDays: string;
}
