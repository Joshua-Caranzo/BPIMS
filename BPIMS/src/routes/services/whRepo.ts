import { CallResultDto } from "../types/CallResultDto";
import { WHStockDto, WHStockInputDto, WHStockInputHistoryDto } from "../types/whType";
import { getFromBaseApi, postToBaseApi } from "../utils/apiService";

export async function getWHStocks(categoryId: number, page: number, search: string, branchId: number) {
    return await getFromBaseApi<CallResultDto<WHStockDto[]>>('getWHStocks', { categoryId, page, search, branchId });
}

export async function getWHStockHistory(itemId: number) {
    return await getFromBaseApi<CallResultDto<WHStockInputHistoryDto[]>>('getWHStockHistory', { itemId });
}

export async function createWHStockInput(stockInput: WHStockInputDto) {
    return await postToBaseApi<CallResultDto<object>>('createWHStockInput', { stockInput });
}