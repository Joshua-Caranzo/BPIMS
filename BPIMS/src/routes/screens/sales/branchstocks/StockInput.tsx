import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Alert, Keyboard, ScrollView } from 'react-native';
import { Camera, ChevronLeft } from 'react-native-feather';
import DatePicker from 'react-native-date-picker';
import { BranchStockDto, StockInputDto } from '../../../types/stockType';
import { UserDetails } from '../../../types/userType';
import { useNavigation } from '@react-navigation/native';
import { BranchStackNavigationProps, BranchStockParamList } from '../../../navigation/navigation';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatTransactionDate, formatTransactionDateOnly } from '../../../utils/dateFormat';
import { createStockInput, getStockHistory } from '../../../services/stockRepo';
import NumericKeypad from '../../../../components/NumericKeypad';

type Props = NativeStackScreenProps<BranchStockParamList, 'StockInput'>;

export default function StockInputScreen({ route }: Props) {
    const item: BranchStockDto = route.params.item;
    const user: UserDetails = route.params.user;
    const [loading, setLoading] = useState<boolean>(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [itemHistory, setItemHistory] = useState<StockInputDto[]>([]);
    const [loaderMessage, setLoaderMessage] = useState<string>('Loading Stock Data...');
    const [stockInput, setStockInput] = useState<StockInputDto>();
    const navigation = useNavigation<NativeStackNavigationProp<BranchStockParamList>>();
    const [openDate, setOpenDate] = useState(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [isInputMode, setInputMode] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);

    const fieldLabels: { [key: string]: string } = {
        qty: 'Quantity',
        moq: 'MOQ',
        actualTotalQty: 'Actual Total Quantity',
        expectedTotalQty: 'Expected Total Quantity',
        deliveredBy: 'Delivered By',
        deliveryDate: 'Delivery Date',
    };

    useEffect(() => {
        newStockInput();
    }, []);

    useEffect(() => {
        validateForm();
    }, [stockInput]);

    useEffect(() => {
        getStockInputHistory();
    }, []);

    async function getStockInputHistory() {
        setLoading(true);
        const response = await getStockHistory(item.id);
        setItemHistory(response.data);
        setLoading(false)
    }

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    async function newStockInput() {
        const newStock: StockInputDto = {
            id: 0,
            qty: 0,
            moq: 0,
            actualTotalQty: 0,
            expectedTotalQty: 0,
            deliveredBy: "",
            deliveryDate: new Date,
            branchItemId: item.id
        };
        setStockInput(newStock);
    }

    const handleChange = (field: string, value: string) => {
        setStockInput((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                qty: 0,
                moq: 0,
                actualTotalQty: 0,
                expectedTotalQty: 0,
                deliveredBy: "",
                deliveryDate: new Date,
                branchItemId: item.id
            },
            [field]: value,
        }));
    };

    const handleNumberChange = (field: string, value: string) => {
        setStockInput((prevStock) => ({
            ...prevStock ?? {
                id: 0,
                qty: 0,
                moq: 0,
                actualTotalQty: 0,
                expectedTotalQty: 0,
                deliveredBy: "",
                deliveryDate: new Date,
                branchItemId: item.id
            },
            [field]: isNaN(Number(value)) ? 0 : Number(value),
        }));
    };

    function validateForm() {
        const isFormValid = (
            stockInput?.qty !== 0 &&
            stockInput?.moq !== 0 &&
            stockInput?.actualTotalQty !== 0 &&
            stockInput?.expectedTotalQty !== 0 &&
            stockInput?.deliveredBy?.trim() !== "" &&
            stockInput?.deliveryDate instanceof Date
        );
        setIsValid(isFormValid);
    }

    async function saveStockInput() {
        if (stockInput) {
            await createStockInput(stockInput)
            newStockInput();
            await getStockInputHistory();
        }
    }

    const handleKeyPress = (key: string) => {
        if (editingField && stockInput) {
            if (item.sellByUnit) {
                const currentValue = stockInput[editingField]?.toString() || '';
                const newValue = currentValue + key;
                handleNumberChange(editingField, newValue);
            }
            else {
                let current = (Number(stockInput?.[editingField] || 0).toFixed(2)).replace('.', '');
                current += key;
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
        };
    }

    const handleBackspace = () => {
        if (editingField && stockInput) {
            const currentValue = stockInput[editingField]?.toString() || '';
            const newValue = currentValue.slice(0, -1);
            handleNumberChange(editingField, newValue);
        }

        if (editingField && stockInput) {
            if (item.sellByUnit) {
                const currentValue = stockInput[editingField]?.toString() || '';
                const newValue = currentValue.slice(0, -1);
                handleNumberChange(editingField, newValue);
            }
            else {
                let current = (Number(stockInput?.[editingField] || 0).toFixed(2)).replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
        };
    };

    return (
        <View className="flex flex-1">
            {isInputMode && editingField ? (
                <View style={{ flex: 1 }}>
                    <View className='top-3 flex flex-row px-2'>
                        <TouchableOpacity
                            className="bg-gray px-1 pb-2 ml-2"
                            onPress={() => setInputMode(false)}
                        >
                            <ChevronLeft height={28} width={28} color={"#fe6500"} />
                        </TouchableOpacity>
                        <Text className="text-black text-lg font-bold ml-3">Please Enter Quantity</Text>
                    </View>
                    <View className="w-full h-[2px] bg-gray-500 mt-3 mb-2"></View>
                    <View className="items-center mt-4">
                        <View className="flex flex-column items-center">
                            <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter {fieldLabels[editingField ?? 'qty']}
                            </Text>

                            <View className="flex flex-row items-center mt-6 w-48 border-b-2 border-[#fe6500] px-4 justify-center">
                                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                    {item.sellByUnit
                                        ? String(stockInput?.[editingField] || 0)
                                        : Number(stockInput?.[editingField] || 0).toFixed(2)}
                                </Text>

                            </View>
                        </View>
                    </View>
                    <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                        <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                        <TouchableOpacity disabled={!stockInput?.[editingField]} onPress={() => setInputMode(false)} className="w-[95%] rounded-xl p-3 flex flex-row items-center bg-[#fe6500]">
                            <View className="flex-1 flex flex-row items-center justify-center">
                                <Text className="text-lg text-center font-bold text-white">
                                    Done
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View className="flex flex-1">
                    <View className='top-3 flex flex-row justify-between px-2'>
                        <TouchableOpacity
                            className="bg-gray px-1 pb-2 ml-2"
                            onPress={() => navigation.push('BranchStock')}
                        >
                            <ChevronLeft height={28} width={28} color={"#fe6500"} />
                        </TouchableOpacity>
                        <View className='pr-4 flex-1 items-center'>
                            <Text className="text-black text-lg font-bold mb-1">STOCK INPUTS</Text>
                        </View>
                        <View className="items-center">
                            <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                                <Text
                                    className="text-white"
                                    style={{ fontSize: user?.name && user.name.split(" ")[0].length > 8 ? 10 : 12 }}
                                >
                                    {user?.name ? user.name.split(" ")[0].toUpperCase() : ""}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="px-4 w-full mt-6">
                        <View className="w-full flex items-center">
                            <Text className="text-black text-sm">{item.name}</Text>
                            <View className='w-full mt-2'>
                                {fileUrl ? (
                                    <Image source={{ uri: fileUrl }} className="w-24 h-24 rounded-lg" />
                                ) : (
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
                                        <TouchableOpacity
                                            className="border-b border-gray-400 py-2"
                                            onPress={() => {
                                                setEditingField('qty');
                                                setInputMode(true);
                                            }}
                                        >
                                            <Text className="text-black">{item.sellByUnit ? stockInput.qty : stockInput.qty.toFixed(2)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View className='w-1/2'>
                                        <Text className="text-red-500 text-sm font-bold">MOQ</Text>
                                        <TouchableOpacity
                                            className="border-b border-gray-400 py-2"
                                            onPress={() => {
                                                setEditingField('moq');
                                                setInputMode(true);
                                            }}
                                        >
                                            <Text className="text-black">{item.sellByUnit ? stockInput.moq : stockInput.moq.toFixed(2)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className='flex flex-row w-full gap-2 mt-4'>
                                    <View className='w-1/2'>
                                        <Text className="text-gray-700 text-sm font-bold">Delivery Date</Text>
                                        <TouchableOpacity onPress={() => setOpenDate(true)} className='border-b border-gray-400 py-2 text-black'>
                                            <Text>{stockInput?.deliveryDate.toDateString()}</Text>
                                        </TouchableOpacity>
                                        <DatePicker
                                            modal
                                            open={openDate}
                                            date={stockInput?.deliveryDate}
                                            mode="date"
                                            onConfirm={(date) => {
                                                setOpenDate(false)
                                                setStockInput(stock => ({
                                                    ...stock ?? {
                                                        id: 0,
                                                        qty: 0,
                                                        moq: 0,
                                                        actualTotalQty: 0,
                                                        expectedTotalQty: 0,
                                                        deliveredBy: "",
                                                        deliveryDate: new Date,
                                                        branchItemId: item.id
                                                    },
                                                    deliveryDate: date,
                                                }));
                                            }}
                                            onCancel={() => {
                                                setOpenDate(false)
                                            }}
                                        />
                                    </View>
                                    <View className='w-1/2'>
                                        <Text className="text-gray-700 text-sm font-bold">Delivered By</Text>
                                        <TextInput
                                            value={stockInput?.deliveredBy || ""}
                                            editable={true}
                                            className="border-b border-gray-400 py-2 text-black"
                                            placeholder="Enter Name"
                                            placeholderTextColor="gray"
                                            onChangeText={(text) => handleChange("deliveredBy", text)}
                                        />
                                    </View>
                                </View>

                                <View className='flex flex-row w-full gap-2 mt-4'>
                                    <View className='w-1/2'>
                                        <Text className="text-gray-700 text-sm font-bold">Expected Total Qty</Text>
                                        <TouchableOpacity
                                            className="border-b border-gray-400 py-2"
                                            onPress={() => {
                                                setEditingField('expectedTotalQty');
                                                setInputMode(true);
                                            }}
                                        >
                                            <Text className="text-black">{item.sellByUnit ? stockInput.expectedTotalQty : stockInput.expectedTotalQty.toFixed(2)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View className='w-1/2'>
                                        <Text className="text-gray-700 text-sm font-bold">Actual Total Qty</Text>
                                        <TouchableOpacity
                                            className="border-b border-gray-400 py-2"
                                            onPress={() => {
                                                setEditingField('actualTotalQty');
                                                setInputMode(true);
                                            }}
                                        >
                                            <Text className="text-black">{item.sellByUnit ? stockInput.actualTotalQty : stockInput.actualTotalQty.toFixed(2)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View className="mt-4">
                            <Text className="text-gray-700 text-sm font-bold">Item History</Text>
                            <ScrollView className="w-full mb-8 mt-1">
                                {itemHistory.length > 0 && itemHistory.map((order) => (
                                    <View key={order.id} className='flex flex-row justify-between'>
                                        <Text className='text-black text-xs'>{item.sellByUnit ? Math.round(order.qty) : order.qty}</Text>
                                        <Text className='text-black text-xs'>{order.deliveredBy}</Text>
                                        <Text className='text-black text-xs'>{formatTransactionDateOnly(order.deliveryDate.toString())}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                    {!keyboardVisible && (
                        <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                            <TouchableOpacity
                                onPress={saveStockInput}
                                className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                                disabled={!isValid}
                            >
                                <View className="flex-1 items-center">
                                    <Text className={`font - bold ${!isValid ? 'text-[#fe6500]' : 'text-white'}`}>SAVE</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )
                    }
                </View >
            )
            }
        </View >
    );
}