
import RNFS from 'react-native-fs';
import { ResponseType } from "axios";
import FileViewer from 'react-native-file-viewer';
import { getFromBaseApi, postToBaseApi, putToBaseApi } from '../utils/apiService';
import { CallResultDto } from '../types/CallResultDto';
import { CartDto, CategoryDto, ItemDto, TransactionDto, TransactionItemsDto, TransactionRequestDto } from '../types/salesType';

export async function getCategories() {
    return await getFromBaseApi<CallResultDto<CategoryDto[]>>('getCategories');
}

export async function getProducts(categoryId: number, page: number, search: string, branchId: number) {
    return await getFromBaseApi<CallResultDto<ItemDto[]>>('getProducts', { categoryId, page, search, branchId });
}

export async function getCart() {
    return await getFromBaseApi<CallResultDto<CartDto>>('getCart');
}

export async function addItemToCart(itemId: number, quantity: number) {
    return await postToBaseApi<CallResultDto<object>>('addItemToCart', { itemId, quantity });
}

export async function deleteAllCartItems() {
    return await putToBaseApi<CallResultDto<object>>('deleteAllCartItems');
}

export async function removeCartItem(cartItemId: number) {
    return await putToBaseApi<CallResultDto<object>>('removeCartItem', { cartItemId });
}

export async function updateItemQuantity(cartItemId: number, quantity: number) {
    return await putToBaseApi<CallResultDto<object>>('updateItemQuantity', { cartItemId, quantity });
}

export async function updateDeliveryFee(deliveryFee: number | null) {
    return await putToBaseApi<CallResultDto<object>>('updateDeliveryFee', { deliveryFee });
}

export async function updateDiscount(discount: number | null) {
    return await putToBaseApi<CallResultDto<object>>('updateDiscount', { discount });
}

export async function processPayment(amountReceived: number) {
    return await postToBaseApi<CallResultDto<TransactionRequestDto>>('processPayment', { amountReceived });
}

export async function updateCustomer(id: number | null) {
    return await putToBaseApi<CallResultDto<object>>('updateCustomer', { id });
}

export async function generateReceipt(transaction: TransactionDto, transactionItems: TransactionItemsDto[]) {
    const config = {
        responseType: 'blob' as ResponseType,
    };

    const blob = await postToBaseApi<Blob>('generateReceipt', { transaction, transactionItems }, config);

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
        const base64Data = reader.result?.toString().split(',')[1];

        if (base64Data) {
            const filePath = `${RNFS.ExternalStorageDirectoryPath}/Download/receipt.pdf`;

            await RNFS.writeFile(filePath, base64Data, 'base64');

            await RNFS.scanFile(filePath);

            FileViewer.open(filePath)
        }
    };
}