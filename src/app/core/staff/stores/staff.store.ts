import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { StaffApi } from '../apis/staff.api';
import { mapApiResponseToStaff } from '../dtos/staff.dto';
import { Staff } from '../models/staff.model';

interface StaffState {
	staff: Staff[];
	isLoading: boolean;
	error: string | null;
	currentPage: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

const initialState: StaffState = {
	staff: [],
	isLoading: false,
	error: null,
	currentPage: 1,
	pageSize: 5,
	totalCount: 0,
	totalPages: 0,
	hasNextPage: false,
	hasPreviousPage: false,
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StaffStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),

	withMethods((store) => {
		const staffApi = inject(StaffApi);

		return {
			async loadStaffPaginated(
				organizationId: string,
				page: number,
				pageSize: number,
			): Promise<void> {
				patchState(store, { isLoading: true, error: null });
				try {
					const response = await firstValueFrom(
						staffApi.getStaff(organizationId, page, pageSize),
					);
					const staff = response.items.map(mapApiResponseToStaff);
					patchState(store, {
						staff,
						isLoading: false,
						currentPage: Number(response.page),
						pageSize: Number(response.pageSize),
						totalCount: Number(response.totalCount),
						totalPages: Number(response.totalPages),
						hasNextPage: response.hasNextPage,
						hasPreviousPage: response.hasPreviousPage,
					});
				} catch {
					patchState(store, { error: 'Failed to load staff', isLoading: false });
				}
			},
		};
	}),
);
