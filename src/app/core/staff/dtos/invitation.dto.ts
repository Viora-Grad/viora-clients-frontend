export interface CreateStaffInvitationRequest {
	branchIds: string[];
	roleIds: string[];
}

export interface CreateStaffInvitationResponse {
	invitationToken: string;
}
