export type UserDto = {
	name: string;
	branchName: string;
	branchId: number;
	departmentId: number;
	departmentName: string;
	token: string;
	hasHeadAccess: boolean
};

export type UserDetails = {
	departmentId: number;
	name: string;
	branchName: string;
	departmentName: string;
	branchId: number;
	hasHeadAccess: string;
};

export type UserListDto = {
	id: number;
	name: string;
	email: string;
	branchName?: string | null;
	branchId?: number | null;
	departmentId: number;
	deptName: string;
	hasHeadAccess: boolean;
	password: string | null
};

export type ObjectDto = {
	id: number;
	name: string;
};