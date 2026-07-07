export interface Service {
	id: string;
	branchId: string;
	name: string;
	description: string;
	serviceType: string;
	status: string;
	durationMinutes: string;
	cost: string;
	currency: string;
	discount: ServiceDiscount | null;
}

export interface ServiceDiscount {
	percentageOutOf100: string;
	reason: string;
	startDateUtc: string;
	endDateUtc: string;
}
