import { CallResultDto } from "../types/CallResultDto";
import { ObjectDto } from "../types/userType";
import { SupplierDto, WHStockDto, WHStockInputDto, WHStockInputHistoryDto } from "../types/whType";
import { getFromBaseApi, postToBaseApi } from "../utils/apiService";

export async function getWHStocks(categoryId: number, page: number, search: string, branchId: number) {
    return await getFromBaseApi<CallResultDto<WHStockDto[]>>('getWHStocks', { categoryId, page, search, branchId });
}

export async function getWHStockHistory(itemId: number) {
    return await getFromBaseApi<CallResultDto<WHStockInputHistoryDto[]>>('getWHStockHistory', { itemId });
}

export async function getSupplierStockHistory(supplierId: number) {
    return await getFromBaseApi<CallResultDto<WHStockInputHistoryDto[]>>('getSupplierStockHistory', { supplierId });
}

export async function createWHStockInput(stockInput: WHStockInputDto) {
    return await postToBaseApi<CallResultDto<object>>('createWHStockInput', { stockInput });
}

export async function getSupplierList(search: string) {
    return await getFromBaseApi<CallResultDto<ObjectDto[]>>('getSupplierList', { search });
}

export async function getSupplier(id: number) {
    return await getFromBaseApi<CallResultDto<SupplierDto>>('getSupplier', { id });
}

export async function saveSupplier(supplier: SupplierDto) {
    return await postToBaseApi<CallResultDto<object>>('saveSupplier', { supplier });
}

export async function removeSupplier(id: number) {
    return await postToBaseApi<CallResultDto<object>>('removeSupplier', { id });
}