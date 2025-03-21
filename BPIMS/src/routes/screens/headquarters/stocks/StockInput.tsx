import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Keyboard, ScrollView, ActivityIndicator, Modal, TouchableWithoutFeedback, FlatList } from 'react-native';
import { Camera, ChevronLeft, XCircle } from 'react-native-feather';
import DatePicker from 'react-native-date-picker';
import { StockInputDto, StockInputHistoryDto } from '../../../types/stockType';
import { useNavigation } from '@react-navigation/native';
import { StockMonitorParamList } from '../../../navigation/navigation';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatTransactionDateOnly, truncateName, truncateShortName } from '../../../utils/dateFormat';
import { createStockInput, getStockHistory } from '../../../services/stockRepo';
import NumericKeypad from '../../../../components/NumericKeypad';
import FastImage from 'react-native-fast-image';
import { createWHStockInput, getWHStockHistory } from '../../../services/whRepo';
import { WHStockInputDto, WHStockInputHistoryDto } from '../../../types/whType';
import { ObjectDto } from '../../../types/userType';

type Props = NativeStackScreenProps<StockMonitorParamList, 'StockInput'>;

const StockInputScreen = memo(({ route }: Props) => {
    const { item, user, branchId, whId, whQty } = route.params;
    const suppliers: ObjectDto[] = route.params.suppliers;
    const [loading, setLoading] = useState<boolean>(false);
    const [itemHistory, setItemHistory] = useState<StockInputHistoryDto[]>([]);
    const [whItemHistory, setWHItemHistory] = useState<WHStockInputHistoryDto[]>([]);
    const [stockInput, setStockInput] = useState<StockInputDto | WHStockInputDto>();
    const navigation = useNavigation<NativeStackNavigationProp<StockMonitorParamList>>();
    const [openDate, setOpenDate] = useState(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [isInputMode, setInputMode] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [lastSavedValue, setLastSavedValue] = useState<number | string | Date>(0);
    const [openSuppliers, setOpenSuppliers] = useState<boolean>(false);
    const isBranchIdPresent = stockInput?.branchId !== null && stockInput?.branchId !== undefined;

    const fieldLabels: { [key: string]: string } = useMemo(() => ({
        qty: 'Quantity',
        actualTotalQty: 'Actual Total Quantity',
        expectedTotalQty: 'Expected Total Quantity',
        deliveredBy: 'Delivered By',
        deliveryDate: 'Delivery Date',
    }), []);

    useEffect(() => {
        FastImage.clearMemoryCache();
        FastImage.clearDiskCache();
        initializeStockInput();
        getStockInputHistory();
    }, []);

    useEffect(() => {
        validateForm();
    }, [stockInput]);

    const initializeStockInput = useCallback(() => {
        const newStock: StockInputDto | WHStockInputDto = branchId ? {
            id: 0,
            qty: 0,
            actualTotalQty: 0,
            expectedTotalQty: 0,
            deliveredBy: "",
            deliveryDate: new Date(),
            branchItemId: branchId,
        } : {
            id: whId ?? 0,
            qty: 0,
            actualTotalQty: 0,
            expectedTotalQty: 0,
            deliveredBy: 0,
            deliveryDate: new Date(),
            deliveredByName: ""
        };
        setStockInput(newStock)
        return newStock;
    }, [branchId, whId]);

    const getStockInputHistory = useCallback(async () => {
        try {
            setLoading(true)
            if (branchId) {
                const response = await getStockHistory(branchId);
                setItemHistory(response.data);
            }
            if (whId) {
                const response = await getWHStockHistory(whId);
                setWHItemHistory(response.data);
            }
            setLoading(false)
        }
        finally {
            setLoading(false)
        }
    }, [branchId, whId]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleChange = useCallback((field: string, value: string | number | Date) => {
        setStockInput(prev => {
            const updatedStock = {
                ...(prev ?? initializeStockInput()),
                [field]: value,
            };
            return updatedStock;
        });
    }, [initializeStockInput]);

    const handleNumberChange = useCallback((field: string, value: string) => {
        const numericValue = isNaN(Number(value)) ? 0 : Number(value);
        handleChange(field, numericValue);
    }, [handleChange]);

    const validateForm = useCallback(() => {
        if (!stockInput) {
            setIsValid(false);
            return;
        }

        const branchValid = !!branchId;

        const isFormValid = (
            stockInput.qty !== 0 &&
            stockInput.actualTotalQty !== 0 &&
            stockInput.expectedTotalQty !== 0 &&
            stockInput.deliveryDate instanceof Date &&
            (!branchValid || (branchValid && !!stockInput.deliveredBy))
        );

        setIsValid(!!isFormValid);
    }, [stockInput, branchId]);


    const saveStockInput = useCallback(async () => {
        try {
            setLoading(true)

            if (stockInput)
                if (isStockInputDto(stockInput)) {
                    await createStockInput(stockInput);
                }
                else {
                    if (stockInput.deliveredBy == 0)
                        stockInput.deliveredBy = null
                    await createWHStockInput(stockInput)
                }
            initializeStockInput();
            await getStockInputHistory();
            setLoading(false)
        }
        finally {
            setLoading(false)
        }
    }, [stockInput, initializeStockInput, getStockInputHistory]);

    const isStockInputDto = (input: StockInputDto | WHStockInputDto | undefined): input is StockInputDto => {
        return (input as StockInputDto).branchItemId !== undefined;
    };

    const handleKeyPress = useCallback((key: string) => {
        if (editingField && stockInput) {
            if (branchId && whQty)
                if (item.sellByUnit) {
                    const currentValue = stockInput[editingField]?.toString() || '';
                    const newValue = currentValue + key;
                    if (Number(newValue) <= whQty) {
                        handleNumberChange(editingField, newValue);
                        setMessage(null)
                    }
                    else {
                        setMessage(`Quantity exceeds available warehouse stock. Available stock: ${Math.round(whQty)}`);
                        return;
                    }
                } else {
                    let current = (Number(stockInput?.[editingField] || 0).toFixed(2).replace('.', ''));
                    current += key;
                    const formatted = (parseInt(current) / 100).toFixed(2);
                    if (Number(formatted) <= whQty) {
                        handleNumberChange(editingField, formatted);
                        setMessage(null)
                    }
                    else {
                        setMessage(`Quantity exceeds available warehouse stock. Available stock: ${Number(whQty).toFixed(2)}`);
                        return;
                    }
                }
            else if (whId) {
                if (item.sellByUnit) {
                    const currentValue = stockInput[editingField]?.toString() || '';
                    const newValue = currentValue + key;
                    handleNumberChange(editingField, newValue);
                } else {
                    let current = (Number(stockInput?.[editingField] || 0).toFixed(2).replace('.', ''));
                    current += key;
                    const formatted = (parseInt(current) / 100).toFixed(2);
                    handleNumberChange(editingField, formatted);
                }
            }
        }
    }, [editingField, stockInput, item.sellByUnit, handleNumberChange]);

    const handleBackspace = useCallback(() => {
        setMessage(null)
        if (editingField && stockInput) {
            if (item.sellByUnit) {
                const currentValue = stockInput[editingField]?.toString() || '';
                const newValue = currentValue.slice(0, -1);
                handleNumberChange(editingField, newValue);
            } else {
                let current = (Number(stockInput?.[editingField] || 0).toFixed(2)).replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
        }
    }, [editingField, stockInput, item.sellByUnit, handleNumberChange]);

    const handleBackKeypad = (field: string | null) => {
        if (editingField && stockInput && field) {
            setStockInput((prevStock) => ({
                ...prevStock ?? {
                    id: 0,
                    qty: 0,
                    actualTotalQty: 0,
                    expectedTotalQty: 0,
                    deliveredBy: "",
                    deliveryDate: new Date,
                    branchItemId: item.id
                },
                [field]: lastSavedValue,
            }));
        }
        setInputMode(false);
        setEditingField(null);
    };

    const renderModal = () => (
        <Modal transparent visible={openSuppliers} animationType="slide">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white p-5 rounded-lg w-4/5 relative">
                        <TouchableOpacity className="absolute top-2 right-2 p-1" onPress={() => setOpenSuppliers(false)}>
                            <XCircle width={24} height={24} />
                        </TouchableOpacity>

                        <Text className="text-lg font-bold mb-2 text-center">
                            Select Supplier
                        </Text>

                        <FlatList
                            data={suppliers}
                            keyExtractor={(item) => item.id.toString()}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="p-3 border-b border-gray-200"
                                    onPress={() => {
                                        handleChange('deliveredBy', item.id);
                                        handleChange('deliveredByName', item.name);
                                        setOpenSuppliers(false);
                                    }}
                                >
                                    <Text className="text-base">{truncateName(item.name)}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    const renderInputMode = useMemo(() => (
        <View style={{ flex: 1 }}>
            <View className='top-3 flex flex-row px-2'>
                <TouchableOpacity className="bg-gray px-1 pb-2 ml-2" onPress={() => handleBackKeypad(editingField)}>
                    <ChevronLeft height={28} width={28} color={"#fe6500"} />
                </TouchableOpacity>
                <Text className="text-black text-lg font-bold ml-3">Please Enter Quantity</Text>
            </View>
            <View className="w-full h-[2px] bg-gray-500 mt-3 mb-2"></View>
            <View className="items-center mt-4">
                <View className="flex flex-column items-center">
                    <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter {fieldLabels[editingField ?? 'qty']}</Text>
                    <View className="flex flex-row items-center mt-6 w-48 border-b-2 border-[#fe6500] px-4 justify-center">
                        <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                            {editingField && (item.sellByUnit ? String(stockInput?.[editingField] || 0) : Number(stockInput?.[editingField] || 0).toFixed(2))}
                        </Text>
                    </View>
                    {message !== null && (
                        <Text className="text-[10px] font-bold text-red-500">{message}</Text>)
                    }
                </View>
            </View>
            <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                {editingField && (
                    <TouchableOpacity disabled={!stockInput?.[editingField]} onPress={() => setInputMode(false)} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!stockInput?.[editingField] ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}>
                        <View className="flex-1 flex flex-row items-center justify-center">
                            <Text className={`text-lg text-center font-bold text-white ${!stockInput?.[editingField] ? 'text-[#fe6500]' : 'text-white'}`}>
                                Done
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    ), [editingField, fieldLabels, handleBackspace, handleKeyPress, item.sellByUnit, stockInput, message, lastSavedValue]);

    const renderNormalMode = useMemo(() => (
        <View className="flex flex-1">
            <View className='top-3 flex flex-row justify-between px-2'>
                <TouchableOpacity className="bg-gray px-1 pb-2 ml-2" onPress={() => navigation.push('StockMonitor')}>
                    <ChevronLeft height={28} width={28} color={"#fe6500"} />
                </TouchableOpacity>
                <View className='pr-4 flex-1 items-center'>
                    <Text className="text-black text-lg font-bold mb-1">STOCK INPUTS</Text>
                </View>
                <View className="items-center">
                    <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                        <Text className="text-white" style={{ fontSize: 12 }}>
                            {truncateShortName(user?.name ? user.name.split(' ')[0].toUpperCase() : '')}
                        </Text>
                    </View>
                </View>
            </View>

            <View className="px-4 w-full mt-6">
                <View className="w-full flex items-center">
                    <Text className="text-black text-sm">{truncateName(item.name)}</Text>
                    <View className="w-full flex items-center mt-2 mb-2">
                        {item.imagePath ? (
                            <FastImage source={{ uri: item.imagePath, priority: FastImage.priority.high }} className="w-24 h-24 rounded-lg" />) : (
                            <View className="w-full h-24 bg-gray-500 rounded-lg justify-center items-center">
                                <Camera color={"white"} height={32} width={32} />
                                <Text className='text-white text-xs mt-1'>No Image</Text>
                            </View>
                        )}
                    </View>
                </View>

                {stockInput && (
                    <View className='w-full mt-4'>
                        <View className='flex flex-row w-full gap-2'>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Quantity</Text>
                                <TouchableOpacity className="border-b border-gray-400 py-2" onPress={() => {
                                    setEditingField('qty'); setInputMode(true); setMessage(null); setLastSavedValue(Number(stockInput.qty));
                                }}>
                                    <Text className="text-black">{item.sellByUnit ? stockInput.qty : stockInput.qty.toFixed(2)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='w-1/2'>
                                <Text className="text-red-500 text-sm font-bold">MOQ</Text>
                                <View className="border-b border-gray-400 py-2">
                                    <Text className="text-black">{item.sellByUnit ? Math.round(item.moq || 0) : (item.moq || 0.00)}</Text>
                                </View>
                            </View>
                        </View>

                        <View className='flex flex-row w-full gap-2 mt-4'>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Delivery Date</Text>
                                <TouchableOpacity onPress={() => setOpenDate(true)} className='border-b border-gray-400 py-2 text-black'>
                                    <Text>{stockInput?.deliveryDate.toDateString()}</Text>
                                </TouchableOpacity>
                                <DatePicker modal open={openDate} date={stockInput?.deliveryDate} mode="date"
                                    onConfirm={(date) => { setOpenDate(false); handleChange('deliveryDate', date); }}
                                    onCancel={() => setOpenDate(false)} />
                            </View>
                            {branchId ? (
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Delivered By</Text>
                                    <TextInput
                                        value={stockInput?.deliveredBy?.toString() || ""}
                                        editable={true}
                                        className="border-b border-gray-400 py-2 text-black"
                                        placeholder="Enter Name"
                                        placeholderTextColor="gray"
                                        onChangeText={(text) => handleChange("deliveredBy", text)}
                                        selectionColor="#fe6500"
                                    />
                                </View>
                            ) : (
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Delivered By</Text>
                                    <TouchableOpacity
                                        className="border-b border-gray-400 py-2"
                                        onPress={() => setOpenSuppliers(true)}
                                    >
                                        <Text className={`${stockInput.deliveredBy ? 'text-black' : 'text-gray-500'} ml-1`}>{stockInput.deliveredByName?.toString() || 'Select Supplier'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View className='flex flex-row w-full gap-2 mt-4'>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Expected Total Qty</Text>
                                <TouchableOpacity className="border-b border-gray-400 py-2" onPress={() => { setEditingField('expectedTotalQty'); setLastSavedValue(stockInput.expectedTotalQty); setInputMode(true); setMessage(null); }}>
                                    <Text className="text-black">{item.sellByUnit ? stockInput.expectedTotalQty : stockInput.expectedTotalQty.toFixed(2)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='w-1/2'>
                                <Text className="text-gray-700 text-sm font-bold">Actual Total Qty</Text>
                                <TouchableOpacity className="border-b border-gray-400 py-2" onPress={() => { setEditingField('actualTotalQty'); setInputMode(true); setMessage(null); setLastSavedValue(stockInput.actualTotalQty) }}>
                                    <Text className="text-black">{item.sellByUnit ? stockInput.actualTotalQty : stockInput.actualTotalQty.toFixed(2)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                {loading && (
                    <ActivityIndicator className='mt-4' size={'small'} color={'#fe6500'}></ActivityIndicator>
                )}
                {itemHistory.length > 0 && (
                    <View className="flex flex-column mt-4 h-[35vh] md:h-[50vh] lg:h-[60vh] pb-2">
                        <Text className="text-gray-700 text-sm font-bold">Item History</Text>
                        <ScrollView className="w-full mb-8 mt-1">
                            <View className="flex flex-row justify-between border-b pb-2 mb-2 border-gray-300">
                                <Text className="text-black text-xs font-semibold flex-1 text-left">Quantity</Text>
                                <Text className="text-black text-xs font-semibold flex-1 text-center">Delivered By</Text>
                                <Text className="text-black text-xs font-semibold flex-1 text-right">Date</Text>
                            </View>

                            {itemHistory.map((whOrder) => (
                                <View key={whOrder.id} className="flex flex-row justify-between py-1 border-b border-gray-200">
                                    <Text className="text-black text-xs flex-1 text-left">{item.sellByUnit ? Math.round(whOrder.qty) : Number(whOrder.qty).toFixed(2)}</Text>
                                    <Text className="text-black text-xs flex-1 text-center">{truncateName(whOrder.deliveredBy)}</Text>
                                    <Text className="text-black text-xs flex-1 text-right">{formatTransactionDateOnly(whOrder.deliveryDate.toString())}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {whItemHistory.length > 0 && (
                    <View className="flex flex-column mt-4 h-[35vh] md:h-[50vh] lg:h-[60vh] pb-2">
                        <Text className="text-gray-700 text-sm font-bold">Item History</Text>
                        <ScrollView className="w-full mb-8 mt-1">
                            <View className="flex flex-row justify-between border-b pb-2 mb-2 border-gray-300">
                                <Text className="text-black text-xs font-semibold flex-1 text-left">Quantity</Text>
                                <Text className="text-black text-xs font-semibold flex-1 text-center">Delivered By</Text>
                                <Text className="text-black text-xs font-semibold flex-1 text-right">Date</Text>
                            </View>

                            {whItemHistory.map((whOrder) => (
                                <View key={whOrder.id} className="flex flex-row justify-between py-1 border-b border-gray-200">
                                    <Text className="text-black text-xs flex-1 text-left">{item.sellByUnit ? Math.round(whOrder.qty) : Number(whOrder.qty).toFixed(2)}</Text>
                                    <Text className="text-black text-xs flex-1 text-center">{truncateName(whOrder.deliveredByName || "(No Supplier)")}</Text>
                                    <Text className="text-black text-xs flex-1 text-right">{formatTransactionDateOnly(whOrder.deliveryDate.toString())}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
            {!keyboardVisible && (
                <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                    <TouchableOpacity
                        onPress={saveStockInput}
                        className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                        disabled={!isValid}
                    >
                        <View className="flex-1 items-center">
                            <Text className={`font-bold text-lg ${!isValid ? 'text-[#fe6500]' : 'text-white'}`}>SAVE</Text>
                        </View>
                        {loading && (
                            <ActivityIndicator size={'small'} color={`${!isValid ? '#fe6500' : 'white'}`}></ActivityIndicator>
                        )}
                    </TouchableOpacity>
                    {renderModal()}
                </View>
            )}
        </View >
    ), [handleChange, item, itemHistory, whItemHistory, keyboardVisible, navigation, openDate, saveStockInput, stockInput, user?.name, isValid, openSuppliers, suppliers]);

    return (
        <View className="flex flex-1">
            {isInputMode && editingField ? renderInputMode : renderNormalMode}
        </View>
    );
});

export default StockInputScreen;