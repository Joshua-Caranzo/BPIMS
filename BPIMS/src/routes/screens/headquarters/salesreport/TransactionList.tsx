import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    TouchableOpacity,
    TextInput,
    Text,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { ChevronLeft, Search } from 'react-native-feather';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { SalesReportHQParamList } from '../../../navigation/navigation';
import { capitalizeFirstLetter, formatTransactionDate, truncateShortName } from '../../../utils/dateFormat';
import { DailyTransactionDto } from '../../../types/reportType';
import { getAllTransactionHistoryHQ } from '../../../services/salesRepo';

type Props = NativeStackScreenProps<SalesReportHQParamList, 'TransactionList'>;

const TransactionListScreen = React.memo(({ route }: Props) => {
    const [transactions, setTransactions] = useState<DailyTransactionDto[]>(route.params.transactions);
    const branches: ObjectDto[] = route.params.branches
    const user: UserDetails = route.params.user
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [activeBranch, setActiveBranch] = useState<number | null>(null);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<SalesReportHQParamList>>();

    const handleSearchClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    useFocusEffect(
        useCallback(() => {
            getTransactionHistory(activeBranch, page, search);
        }, [activeBranch, page, search])
    );

    const getTransactionHistory = useCallback(async (branchId: number | null, page: number, search: string) => {
        try {
            if (!loadingMore)
                setLoading(true);
            const response = await getAllTransactionHistoryHQ(branchId, page, search.trim());
            if (response.isSuccess) {
                let tr = response.data;
                setTransactions(prev => page === 1 ? tr : [...prev, ...tr]);
                if (tr.length === 0 || transactions.length + tr.length >= (response.totalCount || 0)) {
                    setHasMoreData(false);
                } else {
                    setHasMoreData(true);
                }
            } else {
                setTransactions([])
            }
            setLoading(false);
            setLoadingMore(false);
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeBranch, loadingMore, transactions.length]);

    const loadMoreTransactions = () => {
        if (hasMoreData && !loadingMore) {
            setLoadingMore(true);
            setPage(prev => prev + 1);
        }
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View className="py-2">
                <ActivityIndicator size="small" color="#fe6500" />
            </View>
        );
    };

    const renderItem = useCallback(({ item }: { item: DailyTransactionDto }) => (
        <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory', { transactionId: item.id })} className="mb-3 py-1 bg-gray rounded-lg border-b border-gray-500">
            <View className="flex-row justify-between">
                <View className="flex flex-row justify-between w-full">
                    <Text className="text-gray-500 font-medium">{item.slipNo}</Text>
                    <Text className="text-gray-500 font-medium">
                        {formatTransactionDate(item.transactionDate.toString())}
                    </Text>
                </View>
            </View>
            <View className="flex-row justify-between">
                <View className="flex flex-row w-full justify-between">
                    <Text className="text-black font-semibold">
                        ₱ {Number(item.totalAmount).toFixed(2)}
                    </Text>
                    <Text className="text-gray-500 font-medium">
                        By: {capitalizeFirstLetter(item.cashierName)}
                    </Text>
                </View>
            </View>
            <View className="flex-row items-center">
                <Text className="text-gray-700 font-medium">
                    {item.items.length} {item.items.length === 1 ? 'item' : 'items'}:
                </Text>
                <Text className="text-gray-600 flex-1" numberOfLines={1} ellipsizeMode="tail">
                    {item.items.map((item) => item.itemName).join(', ')}
                </Text>
            </View>
        </TouchableOpacity>
    ), []);

    return (
        <View className='flex flex-1'>
            <View className='top-3 flex flex-row justify-between px-2'>
                <TouchableOpacity className="bg-gray px-1 pb-2 ml-2" onPress={() => navigation.push('SalesReport')}>
                    <ChevronLeft height={28} width={28} color={"#fe6500"} />
                </TouchableOpacity>
                <View className='pr-4 flex-1 items-center'>
                    <Text className="text-black text-lg font-bold mb-1">TRANSACTIONS</Text>
                </View>
                <View className="items-center">
                    <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                        <Text className="text-white" style={{ fontSize: 12 }}>
                            {truncateShortName(user?.name ? user.name.split(' ')[0].toUpperCase() : '')}
                        </Text>
                    </View>
                </View>
            </View>
            <View className="justify-center items-center bg-gray relative mt-3">
                <View className="w-[90%] flex-row justify-between pr-4 pl-4">
                    {[
                        { id: null, name: "All" },
                        ...branches.filter((b) => b.id !== 0),
                    ].map((b) => (
                        <TouchableOpacity
                            onPress={() => setActiveBranch(b.id)}
                            key={b.id ?? "all"}
                            className="rounded-full mx-1"
                        >
                            <Text className={`${activeBranch === b.id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium`}>
                                {b.name.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="w-full h-[2px] bg-gray-500 mt-1"></View>
            </View>
            <View className="justify-center items-center bg-gray relative">
                <View className="flex flex-row w-full bg-gray-300 py-1 px-3 items-center">
                    <View className="flex-row items-center rounded-md px-2 flex-1">
                        <TouchableOpacity className="mr-2" onPress={handleSearchClick}>
                            <Search width={20} height={20} color="black" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 h-8 text-black p-1"
                            placeholder="Search Slip #..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={(text) => {
                                setLoading(true)
                                setSearch(text);
                                setPage(1);
                            }}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                </View>
                {loading ? (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-center text-[#fe6500]">Loading Transactions...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={transactions}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        className="w-full mt-4 px-4 h-[40%]"
                        onEndReached={loadMoreTransactions}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                    />
                )}
            </View>
        </View>
    );
});

export default TransactionListScreen;