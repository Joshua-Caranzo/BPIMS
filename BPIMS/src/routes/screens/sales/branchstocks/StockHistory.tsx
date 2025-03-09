import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera, ChevronLeft } from 'react-native-feather';
import { BranchStockDto, StockInputHistoryDto } from '../../../types/stockType';
import { UserDetails } from '../../../types/userType';
import { useNavigation } from '@react-navigation/native';
import { BranchStockParamList } from '../../../navigation/navigation';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatTransactionDateOnly } from '../../../utils/dateFormat';
import FastImage from 'react-native-fast-image';

type Props = NativeStackScreenProps<BranchStockParamList, 'StockHistory'>;

export default function StockHistory({ route }: Props) {
    const item: BranchStockDto = route.params.item;
    const user: UserDetails = route.params.user;
    const history: StockInputHistoryDto = route.params.history
    const navigation = useNavigation<NativeStackNavigationProp<BranchStockParamList>>();
    FastImage.clearMemoryCache();
    FastImage.clearDiskCache();
    return (
        <View className="flex flex-1">
            <View className="flex flex-1">
                <View className='top-3 flex flex-row justify-between px-2'>
                    <TouchableOpacity
                        className="bg-gray px-1 pb-2 ml-2"
                        onPress={() => navigation.push('StockInput', { item, user })}
                    >
                        <ChevronLeft height={28} width={28} color={"#fe6500"} />
                    </TouchableOpacity>
                    <View className='pr-4 flex-1 items-center'>
                        <Text className="text-black text-lg font-bold mb-1">STOCK HISTORY</Text>
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
                        <View className="w-full flex items-center mt-2 mb-2">
                            {item.imagePath ? (
                                <FastImage source={{
                                    uri: item.imagePath, priority: FastImage.priority.high,
                                }} className="w-24 h-24 rounded-lg" />) : (
                                <View className="w-full h-24 bg-gray-500 rounded-lg justify-center items-center">
                                    <Camera color={"white"} height={32} width={32} />
                                    <Text className='text-white text-xs mt-1'>No Image</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {history && (
                        <View className='w-full mt-4'>
                            <View className='flex flex-row w-full gap-2'>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Quantity</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{history.qty}</Text>
                                    </View>
                                </View>
                                <View className='w-1/2'>
                                    <Text className="text-red-500 text-sm font-bold">MOQ</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{item.sellByUnit ? item.moq : Number((item.moq || 0)).toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className='flex flex-row w-full gap-2 mt-4'>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Delivery Date</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{formatTransactionDateOnly(history.deliveryDate.toString())}</Text>
                                    </View>
                                </View>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Delivered By</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{history.deliveredBy}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className='flex flex-row w-full gap-2 mt-4'>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Expected Total Qty</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{history.expectedTotalQty}</Text>
                                    </View>
                                </View>
                                <View className='w-1/2'>
                                    <Text className="text-gray-700 text-sm font-bold">Actual Total Qty</Text>
                                    <View
                                        className="border-b border-gray-400 py-2"
                                    >
                                        <Text className="text-black">{history.actualTotalQty}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View >
        </View >
    );
}