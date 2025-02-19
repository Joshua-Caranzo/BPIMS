import { CallResultDto } from "../types/CallResultDto";
import { BranchStockDto, StockInputDto } from "../types/stockType";
import { getFromBaseApi, postToBaseApi } from "../utils/apiService";

export async function getBranchStocks(categoryId: number, page: number, search: string, branchId: number) {
    return await getFromBaseApi<CallResultDto<BranchStockDto[]>>('getBranchStocks', { categoryId, page, search, branchId });
}

export async function createStockInput(stockInput: StockInputDto) {
    return await postToBaseApi<CallResultDto<object>>('createStockInput', { stockInput });
}

export async function getStockHistory(branchItemId: number) {
    return await getFromBaseApi<CallResultDto<StockInputDto[]>>('getStockHistory', { branchItemId });
}