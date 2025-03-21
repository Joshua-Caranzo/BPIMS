import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { X } from 'react-native-feather';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { SalesReportParamList } from '../../../navigation/navigation';
import { generateReceipt } from '../../../services/salesRepo';
import PDFIcon from '../../../../components/icons/PDFIcon';
import PrinterIcon from '../../../../components/icons/PrinterIcon';
import { formatShortDateTimePH, formatTransactionDate, truncateName } from '../../../utils/dateFormat';
import { TransactionDto, TransactionItemsDto } from '../../../types/customerType';
import { getTransactionHistory } from '../../../services/customerRepo';
import ThermalPrinterModule from 'react-native-thermal-printer';
import { PermissionsAndroid } from 'react-native';
import { base64Image } from '../../../../components/images/base64Image';

type Props = NativeStackScreenProps<SalesReportParamList, 'TransactionHistory'>;

const TransactionHistoryScreen = React.memo(({ route }: Props) => {
    const { transactionId } = route.params;
    const [transaction, setTransaction] = useState<TransactionDto | null>(null);
    const [transactionItems, setTransactionItems] = useState<TransactionItemsDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigation = useNavigation<NativeStackNavigationProp<SalesReportParamList>>();
    const [printLoadig, setPrintLoading] = useState<boolean>(false);

    const fetchTransaction = useCallback(async () => {
        try {
            setLoading(true);
            if (transactionId) {
                const response = await getTransactionHistory(transactionId);
                if (response) {
                    setTransaction(response.data.transaction);
                    setTransactionItems(response.data.transactionItems);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch transaction details.');
        } finally {
            setLoading(false);
        }
    }, [transactionId]);

    useEffect(() => {
        fetchTransaction();
    }, [fetchTransaction]);

    const transactionDate = useMemo(() => {
        if (!transaction?.transactionDate) return '';
        return new Date(transaction.transactionDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        }).replace(',', '');
    }, [transaction?.transactionDate]);

    const subTotal = useMemo(() => {
        return transactionItems.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2);
    }, [transactionItems]);

    const totalAmount = useMemo(() => {
        const deliveryFee = transaction?.deliveryFee || 0;
        const discount = transaction?.discount || 0;
        return (Number(subTotal) + Number(deliveryFee) - Number(discount)).toFixed(2);
    }, [subTotal, transaction?.deliveryFee, transaction?.discount]);

    const handleGeneratePDF = useCallback(async () => {
        if (!transaction || !transactionItems.length) {
            Alert.alert('Error', 'Transaction data is incomplete.');
            return;
        }
        try {
            await generateReceipt(transaction.id, transaction);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate PDF.');
        }
    }, [transaction, transactionItems]);

    async function requestBluetoothPermission() {
        try {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
            return granted;
        } catch (err) {
            console.warn(err);
            return null;
        }
    }


    async function printReceipt() {
        try {
            await requestBluetoothPermission();
            setPrintLoading(true)

            const itemsText = transactionItems
                .map(
                    (item) =>
                        `[L]${item.sellByUnit ? Math.round(Number(item.quantity)).toFixed(0) : Number(item.quantity).toFixed(2)} ${item.name}\n` +
                        `[L]    PHP ${Number(item.price).toFixed(2)} [R] PHP ${Number(item.amount).toFixed(2)}\n` +
                        '[L]\n'
                )
                .join('');
            const text =
                '[L]\n' +
                `[C]<img>${base64Image}</img>\n` +
                '[L]\n' +
                "[C]<b>Balay Panday Hardware</b>\n" +
                '[L]\n' +
                `[L]<font size='normal'>Date: ${formatShortDateTimePH(transaction?.transactionDate.toString() || "")}</font>\n` +
                `[L]<font size='normal'>Cashier: ${transaction?.cashier}</font>\n` +
                `[L]<font size='normal'>Mode of Payment: Cash</font>\n` +
                `[L]<font size='normal'>Number of Items: ${transactionItems.length}</font>\n` +
                `[L]<font size='normal'>Slip Number: ${transaction?.slipNo}</font>\n` +
                `[L]<font size='normal'>Branch: ${transaction?.branch}</font>\n` +
                '[C]--------------------------------\n' +
                `[L]<font size='normal'>Store Pick-Up</font>\n` +
                '[C]--------------------------------\n' +
                '[L]\n' +
                itemsText +
                '[C]--------------------------------\n' +
                `[L]<font size='normal'>Sub Total: [R] PHP ${(Number(subTotal).toFixed(2))}</font>\n` +
                `[L]<font size='normal'>Total Amount: [R] PHP ${Number(transaction?.totalAmount).toFixed(2)}</font>\n` +
                '[C]--------------------------------\n' +
                `[L]<font size='normal'>Cash: [R] PHP ${Number(transaction?.amountReceived).toFixed(2)}</font>\n` +
                `[L]<font size='normal'>Change: [R] PHP ${(Number(transaction?.amountReceived || 0) - Number(transaction?.totalAmount || 0)).toFixed(2)}</font>\n` +
                '[C]--------------------------------\n' +
                `[C]<font size='normal'>Balay Panday Official Receipt</font>\n` +
                `[C]<font size='normal'>Thank you for your purchase!</font>\n` +
                '[L]\n';
            await ThermalPrinterModule.printBluetooth({
                payload: text,
                printerWidthMM: 48,
                printerNbrCharactersPerLine: 32,
                autoCut: true
            });
        } catch (error) {
            Alert.alert("Printing Error", "Failed to print receipt. Check if the printer is on and it is paired with the device.");
        }
        finally { setPrintLoading(false) }
    }

    if (loading) {
        return (
            <View className='flex flex-1 justify-center items-center mt-10'>
                <ActivityIndicator size="large" color="#fe6500" />
            </View>
        );
    }

    if (printLoadig) {
        return (
            <View className='flex flex-1 justify-center items-center mt-10'>
                <ActivityIndicator size="small" color="#fe6500" />
                <Text className="text-center text-[#fe6500]">Printing Receipt...</Text>
            </View>
        );
    }

    if (!transaction) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>No transaction data found.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <View className="flex-1 bg-gray-100 items-center mt-2">
                <View className="relative items-center w-full">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="absolute left-4 rounded-full w-6 h-6 flex items-center justify-center"
                    >
                        <X height={26} width={26} />
                    </TouchableOpacity>
                    <View className="flex w-full px-4 flex-row justify-between mt-10">
                        <Text className="font-bold text-base text-gray-700 text-left">
                            Balay Panday{'\n'}Hardware
                        </Text>
                        <Text className="font-bold text-sm text-gray-700">SLIP# {transaction.slipNo}</Text>
                    </View>
                    <View className="flex w-full px-4 flex-row justify-between mt-2">
                        <View className="flex-1">
                            {transaction.customerName && (
                                <Text className="text-md text-gray-800 text-left">
                                    Customer: {transaction.customerName}
                                </Text>
                            )}
                        </View>
                        <Text className="text-md text-gray-800">{transactionDate}</Text>
                    </View>

                    <View className="justify-between w-[90%] mt-4">
                        <ScrollView className="h-[40%]" contentContainerStyle={{ flexGrow: 1 }}>
                            {transactionItems.map((item, index) => (
                                <View key={index} className="flex flex-row py-2">
                                    <Text className="w-1/6 text-[12px] text-gray-800 text-left">{item.sellByUnit ? Math.round(Number(item.quantity)).toFixed(0) : Number(item.quantity).toFixed(2)}</Text>
                                    <View className="w-1/2 text-gray-800 text-center">
                                        <Text className="text-[12px]">{truncateName(item.name)}</Text>
                                        <Text className="text-[12px] text-gray-600">₱ {item.price}</Text>
                                    </View>
                                    <Text className="w-2/6 text-xs text-gray-800 text-right">
                                        ₱ {Number(item.amount).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                        <View className="w-full items-end mt-5">
                            <Text className="text-sm text-gray-700 text-left mb-1">
                                Sub Total : ₱ {subTotal}
                            </Text>
                            {transaction.deliveryFee && (
                                <Text className="text-sm text-gray-700 text-left mb-1">
                                    Delivery Fee : ₱ {transaction.deliveryFee}
                                </Text>
                            )}
                            {transaction.discount && (
                                <Text className="text-sm text-gray-700 text-left mb-1">
                                    Discount : ₱ {transaction.discount}
                                </Text>
                            )}
                            <Text className="font-bold text-sm text-gray-700 text-left mb-1">
                                TOTAL : ₱ {totalAmount}
                            </Text>
                            <Text className="text-xs text-gray-700 text-left mb-1">
                                Cash : ₱ {transaction.amountReceived}
                            </Text>
                            <Text className="text-xs text-gray-700 text-left">
                                Change: ₱ {(Number(transaction.amountReceived) - Number(transaction.totalAmount)).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <View className="w-full h-[2px] bg-gray-500 mt-1 mb-2"></View>
                    <View className="w-full px-4 items-center mt-1">
                        <Text className="text-xs font-bold text-gray-700 text-center">
                            This is an Order Slip.{'\n'}Ask for an Official Receipt at the Receipt Counter.
                        </Text>
                        <Text className="text-xs text-gray-700 text-left">
                            {formatTransactionDate(transaction.transactionDate.toString())}
                        </Text>
                    </View>
                </View>
                <View
                    className="items-center absolute bottom-0 left-0 right-0 p-2 flex flex-row"
                    style={{ zIndex: 100 }}
                >
                    <TouchableOpacity
                        onPress={handleGeneratePDF}
                        className="w-[35%] rounded-l-xl p-2 items-center bg-gray-900 mr-[1px] flex flex-row justify-center"
                    >
                        <PDFIcon size={36} />
                        <Text className="font-bold text-white">PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={printReceipt}
                        className="w-[65%] rounded-r-xl p-3 items-center flex flex-row justify-center bg-gray-900"
                    >
                        <PrinterIcon size={28} />
                        <Text className="font-bold text-white ml-2">PRINT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

export default TransactionHistoryScreen;