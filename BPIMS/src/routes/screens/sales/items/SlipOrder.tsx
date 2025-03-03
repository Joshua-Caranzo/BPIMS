import React, { useCallback, useMemo } from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Alert
} from 'react-native';
import { X } from 'react-native-feather';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ItemStackParamList } from '../../../navigation/navigation';
import { generateReceipt } from '../../../services/salesRepo';
import PDFIcon from '../../../../components/icons/PDFIcon';
import PrinterIcon from '../../../../components/icons/PrinterIcon';
import { formatTransactionDate } from '../../../utils/dateFormat';

type Props = NativeStackScreenProps<ItemStackParamList, 'SlipOrder'>;

const SlipOrderScreen = React.memo(({ route }: Props) => {
    const { transaction, transactionItems } = route.params;
    const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();
    const subTotal = useMemo(() => Number(transaction.subTotal).toFixed(2), [transaction.subTotal]);
    const deliveryFee = useMemo(() => Number(transaction.deliveryFee).toFixed(2), [transaction.deliveryFee]);
    const discount = useMemo(() => Number(transaction.discount).toFixed(2), [transaction.discount]);
    const totalAmount = useMemo(() => Number(transaction.totalAmount).toFixed(2), [transaction.totalAmount]);
    const amountReceived = useMemo(() => Number(transaction.amountReceived).toFixed(2), [transaction.amountReceived]);
    const change = useMemo(() => (Number(transaction.amountReceived) - Number(transaction.totalAmount)).toFixed(2), [transaction]);

    const transactionDate = useMemo(() => {
        return new Date(transaction.transactionDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        }).replace(',', '');
    }, [transaction.transactionDate]);

    const handleGeneratePDF = useCallback(async () => {
        await generateReceipt(transaction.id, transaction);
    }, [transaction, transactionItems]);

    const handlePrint = useCallback(() => {
        Alert.alert('Printing', 'Print functionality is not implemented yet.');
    }, []);

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
                                        <Text className="text-[12px]">{item.name}</Text>
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
                                    Delivery Fee : ₱ {deliveryFee}
                                </Text>
                            )}
                            {transaction.discount && (
                                <Text className="text-sm text-gray-700 text-left mb-1">
                                    Discount : ₱ {discount}
                                </Text>
                            )}
                            <Text className="font-bold text-sm text-gray-700 text-left mb-1">
                                TOTAL : ₱ {totalAmount}
                            </Text>
                            <Text className="text-xs text-gray-700 text-left mb-1">
                                Cash : ₱ {amountReceived}
                            </Text>
                            <Text className="text-xs text-gray-700 text-left">
                                Change : ₱ {change}
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
                        onPress={handlePrint}
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

export default SlipOrderScreen;