import { CallResultDto } from "../types/CallResultDto";
import { CustomerListDto, CustomerRequest } from "../types/customerType";
import { getFromBaseApi, putFormBaseApi, putToBaseApi } from "../utils/apiService";
import { VITE_MAIN_API } from '@env';

const baseUrl = VITE_MAIN_API

export async function getCustomerList(branchid: number | null, search: string) {
    return await getFromBaseApi<CallResultDto<CustomerListDto[]>>('getCustomerList', { branchid, search });
}

export async function getCustomer(id: number) {
    return await getFromBaseApi<CallResultDto<CustomerRequest>>('getCustomer', { id });
}

export async function saveCustomer(formData: FormData) {
    return await putFormBaseApi<CallResultDto<number>>('saveCustomer', formData);
}

export async function deleteCustomer(id: number) {
    return await putToBaseApi<CallResultDto<object>>('deleteCustomer', { id });
}

export async function getCustomerImage(fileName: string) {
    const timestamp = Date.now();
    return `${baseUrl}/getCustomerImage?fileName=${fileName}&t=${timestamp}`;
}