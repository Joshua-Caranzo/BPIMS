import { CallResultDto } from "../types/CallResultDto";
import { ObjectDto, UserListDto } from "../types/userType";
import { getFromBaseApi, postToBaseApi, putToBaseApi } from "../utils/apiService";

export async function getUsers(search: string) {
    return await getFromBaseApi<CallResultDto<UserListDto[]>>('getUsers', { search });
}

export async function getUser(id: number) {
    return await getFromBaseApi<CallResultDto<UserListDto>>('getUser', { id });
}

export async function addUser(user: UserListDto) {
    return await postToBaseApi<CallResultDto<number>>('addUser', { user });
}

export async function editUser(user: UserListDto) {
    return await putToBaseApi<CallResultDto<number>>('editUser', { user });
}

export async function getDepartments() {
    return await getFromBaseApi<ObjectDto[]>('getDepartments');
}

export async function getBranches() {
    return await getFromBaseApi<ObjectDto[]>('getBranches');
}
