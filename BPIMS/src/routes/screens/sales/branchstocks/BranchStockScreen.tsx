import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    TextInput,
    Text,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Menu, PlusCircle, Search } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getUserDetails } from '../../../utils/auth';
import Sidebar from '../../../../components/Sidebar';
import { UserDetails } from '../../../types/userType';
import { BranchStockDto } from '../../../types/stockType';
import { getBranchStocks } from '../../../services/stockRepo';
import { getSocketData } from '../../../utils/apiService';
import { BranchStockParamList } from '../../../navigation/navigation';

const BranchStockScreen = React.memo(() => {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [stocks, setStocks] = useState<BranchStockDto[]>([]);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [lastCategory, setLastCategory] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loadMore, setLoadMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [criticalCount, setCriticalCount] = useState(0);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<BranchStockParamList>>();

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }
        const socket = getSocketData('criticalItems', { branchId: user.branchId });

        socket.onmessage = (event) => {
            setCriticalCount(Number(event.data));
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            socket.close();
        };
    }, [user]);

    useEffect(() => {
        getItems(activeCategory, page, search);
    }, [search, activeCategory, page]);

    const getItems = useCallback(
        async (categoryId: number, page: number, search: string) => {
            try {
                if (activeCategory !== lastCategory) {
                    setStocks([]);
                }
                if (!loadMore) setLoading(true);

                const userResponse = await getUserDetails();
                setUser(userResponse);

                const response = await getBranchStocks(
                    categoryId,
                    page,
                    search.trim(),
                    Number(userResponse?.branchId)
                );
                if (response.isSuccess) {
                    const newProducts = response.data;
                    setStocks((prevProducts) =>
                        page === 1 ? newProducts : [...prevProducts, ...newProducts]
                    );
                    setHasMoreData(newProducts.length > 0 && stocks.length + newProducts.length < (response.totalCount || 0));
                } else {
                    setStocks([]);
                }

                setLoading(false);
                setLoadMore(false);
            }
            finally {
                setLoading(false);
                setLoadMore(false);
            }
        },
        [activeCategory, lastCategory, loadMore, stocks.length]
    );

    const handleLoadMore = useCallback(() => {
        if (loading || loadMore || !hasMoreData) return;
        setLastCategory(activeCategory);
        setLoadMore(true);
        setPage(prevPage => prevPage + 1);
    }, [hasMoreData, loading, loadMore, activeCategory]);


    const handleChangeCategory = useCallback((id: number) => {
        if (activeCategory !== id) {
            setActiveCategory(id);
            setPage(1);
            setStocks([]);
            setHasMoreData(false);
        }
    }, [activeCategory]);

    const handleSearchClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const handleStockInput = useCallback((item: BranchStockDto) => {
        if (user) {
            navigation.navigate('StockInput', { item, user });
        }
    }, [user, navigation]);

    const renderItem = useCallback(
        ({ item }: { item: BranchStockDto }) => (
            <View className="bg-gray pb-2 px-4 border-b border-gray-300 flex flex-row justify-between">
                <View className="pr-4 flex-1 w-[70%]">
                    <Text className="text-black text-sm mb-1" numberOfLines={1} ellipsizeMode="tail">
                        {item.name}
                    </Text>
                </View>
                <View className="flex flex-row w-[20%] justify-end">
                    <Text
                        className={`${activeCategory === 1 ? 'text-red-600' : 'text-green-600'} font-bold text-sm`}
                    >
                        {item.sellByUnit ? Math.round(Number(item.quantity)).toFixed(0) : Number(item.quantity).toFixed(2)}
                    </Text>
                    <Text className="text-black text-sm">{` ${item.unitOfMeasure || 'pcs'}`}</Text>
                </View>
                {(activeCategory === 1 || activeCategory === 2) && (
                    <TouchableOpacity
                        onPress={() => handleStockInput(item)}
                        className="flex flex-row justify-center items-center w-[10%] justify-end"
                    >
                        <PlusCircle height={15} color="#fe6500" />
                    </TouchableOpacity>
                )}
            </View>
        ),
        [activeCategory, handleStockInput]
    );

    return (
        <View style={{ flex: 1 }}>
            {user && (
                <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <View className="top-3 flex flex-row justify-between px-2 mb-6">
                <TouchableOpacity className="bg-gray mt-1 ml-2" onPress={toggleSidebar}>
                    <Menu width={20} height={20} color="#fe6500" />
                </TouchableOpacity>
                <Text className="text-black text-lg font-bold">BRANCH STOCKS</Text>
                <View className="items-center mr-2">
                    <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                        <Text
                            className="text-white"
                            style={{
                                fontSize: user?.name && user.name.split(' ')[0].length > 8 ? 10 : 12,
                            }}
                        >
                            {user?.name ? user.name.split(' ')[0].toUpperCase() : ''}
                        </Text>
                    </View>
                </View>
            </View>
            <View className="w-full justify-center items-center bg-gray relative">
                <View className="w-full flex-row justify-between px-2">
                    {['STOCKS', 'LOW STOCK ITEMS', 'STOCK INPUTS'].map((label, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleChangeCategory(index)}
                            className={`${activeCategory === index ? 'border-b-4 border-yellow-500' : ''} ${index == 2 ? 'flex flex-row' : ''} w-[30%] justify-center items-center`}
                        >
                            <View className="flex-row items-center space-x-1">
                                <Text
                                    className={`${activeCategory === index ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}
                                >
                                    {label}
                                </Text>
                                {index === 1 && criticalCount > 0 && (
                                    <View className="bg-red-500 rounded-full px-1 flex items-center justify-center -mt-3">
                                        <Text className="text-white text-[8px] font-bold">{criticalCount}</Text>
                                    </View>
                                )}
                            </View>
                            {index === 2 && <PlusCircle height={13} color="#fe6500" />}
                        </TouchableOpacity>

                    ))}
                </View>
            </View>
            <View className="justify-center items-center bg-gray relative mb-2">
                <View className="flex flex-row w-full bg-gray-300 mt-1 py-1 px-3 justify-between items-center">
                    <View className="flex-row items-center rounded-md px-2 flex-1">
                        <TouchableOpacity className="mr-2" onPress={handleSearchClick}>
                            <Search width={20} height={20} color="black" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 h-8 text-black p-1"
                            placeholder="Search items..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={(text) => {
                                setLoading(true);
                                setSearch(text);
                                setPage(1);
                            }}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                </View>
                {loading && (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-center text-[#fe6500]">Loading stocks...</Text>
                    </View>
                )}
            </View>
            <View className="flex-1">
                <FlatList
                    data={stocks}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id.toString() + index.toString()}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        loadMore ? <ActivityIndicator size="small" color="#fe6500" /> : null
                    }
                />
            </View>
        </View>
    );
});

export default BranchStockScreen;