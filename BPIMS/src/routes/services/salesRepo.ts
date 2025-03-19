
import RNFS from 'react-native-fs';
import { ResponseType } from "axios";
import FileViewer from 'react-native-file-viewer';
import { getFromBaseApi, postToBaseApi, putToBaseApi } from '../utils/apiService';
import { CallResultDto } from '../types/CallResultDto';
import { CartDto, CategoryDto, ItemDto, TransactionDto, TransactionItemsDto, TransactionRequestDto } from '../types/salesType';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { DailyTransactionDto } from '../types/reportType';

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

export async function generateReceipt(transactionId: number, transaction: TransactionDto) {
    try {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
        }

        const config = { responseType: 'blob' as ResponseType };
        const blob = await postToBaseApi<Blob>('generateReceipt', { transactionId }, config);

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64Data = reader.result?.toString().split(',')[1];

            if (base64Data) {
                const filePath = `${RNFS.DownloadDirectoryPath}/${transaction.slipNo}_receipt.pdf`;

                await RNFS.writeFile(filePath, base64Data, 'base64');
                await RNFS.scanFile(filePath);

                try {
                    await FileViewer.open(filePath, { showOpenWithDialog: true });
                } catch (error) {
                    console.error("Error opening file:", error);
                    Alert.alert("Failed to open the receipt. Please ensure you have a PDF viewer installed.");
                }
            }
        };
    } catch (error) {
        console.error("Error generating receipt:", error);
        Alert.alert("Error", "Failed to generate the receipt.");
    }
}

export async function getAllTransactionHistory(branchId: number, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<DailyTransactionDto[]>>('getAllTransactions', { branchId, page, search });
}

export async function getAllTransactionHistoryHQ(branchId: number | null, page: number, search: string) {
    return await getFromBaseApi<CallResultDto<DailyTransactionDto[]>>('getAllTransactionsHQ', { branchId, page, search });
}
