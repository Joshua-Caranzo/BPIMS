import { CallResultDto } from "../types/CallResultDto";
import { ItemHQDto } from "../types/itemType";
import { getFromBaseApi } from "../utils/apiService";

export async function getProductsHQ(categoryId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<ItemHQDto[]>>('getProductsHQ', { categoryId, page, search });
}