import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Alert, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { CategoryDto } from '../../../types/salesType';
import { Search, Menu, PlusCircle } from "react-native-feather";
import { getUserDetails } from '../../../utils/auth';
import { UserDetails } from '../../../types/userType';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ItemsHQParamList } from '../../../navigation/navigation';
import { OptimizedFlatList } from 'react-native-optimized-flatlist';
import { getCategoriesHQ, getProductsHQ } from '../../../services/itemsHQRepo';
import { ItemHQDto } from '../../../types/itemType';
import HQSidebar from '../../../../components/HQSidebar';
import FastImage from 'react-native-fast-image';
import { truncateName, truncateShortName } from '../../../utils/dateFormat';

const ItemListScreen = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ItemHQDto[]>([]);
    const [activeCategory, setActiveCategory] = useState(0);
    const [lastCategory, setLastCategory] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingCategory, setLoadingCategory] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [hasMoreData, setHasMoreData] = useState(true);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<ItemsHQParamList>>();

    const newItem: ItemHQDto = {
        id: 0,
        name: "",
        categoryId: 1,
        price: 0,
        cost: 0,
        isManaged: false,
        imagePath: null,
        sellByUnit: false,
        moq: 0,
        categoryName: "",
        unitOfMeasure: "",
        criticalValue: 0,
        imageUrl: null
    };

    const toggleSidebar = () => setSidebarVisible(prev => !prev);

    useEffect(() => {
        const getCategoryList = async () => {
            try {
                setLoadingCategory(true);
                FastImage.clearMemoryCache();
                FastImage.clearDiskCache();
                const response = await getCategoriesHQ();
                if (response.isSuccess) {
                    setCategories(response.data);
                } else {
                    Alert.alert('An error occurred', response.message);
                }
                setLoadingCategory(false);
            }
            finally {
                setLoadingCategory(false);
            }
        };

        getCategoryList();
    }, []);

    useFocusEffect(
        useCallback(() => {
            getItems(activeCategory, page, search);
        }, [])
    );

    useEffect(() => {
        getItems(activeCategory, page, search);
    }, [activeCategory, page, search]);

    const getItems = async (categoryId: number, page: number, search: string) => {
        try {
            if (activeCategory !== lastCategory) {
                setProducts([]);
            }

            if (!loadingMore) setLoading(true);
            const userResponse = await getUserDetails();
            setUser(userResponse);

            const response = await getProductsHQ(categoryId, page, search.trim());

            if (response.isSuccess) {
                let newProducts = response.data;

                setProducts(prevProducts => page === 1 ? newProducts : [...prevProducts, ...newProducts]);

                setHasMoreData(newProducts.length > 0 && products.length + newProducts.length < (response.totalCount || 0));
            } else {
                setProducts([]);
            }
            setLoading(false);
            setLoadingMore(false);
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreCategories = () => {
        if (!loading && !loadingMore && hasMoreData) {
            setLastCategory(activeCategory);
            setLoadingMore(true);
            setPage(prevPage => prevPage + 1);
        }
    };

    const handleCategoryClick = useCallback((id: number) => {
        setLastCategory(activeCategory);
        setLoading(true);
        inputRef.current?.blur();
        setActiveCategory(id);
        setPage(1);
    }, [activeCategory]);

    const handleSearchClick = () => {
        inputRef.current?.focus();
        setPage(1);
    };

    const ProductItem = React.memo(({ item }: { item: ItemHQDto }) => (
        <TouchableOpacity
            className={`m-1 w-full pl-1 pr-3`}
            onPress={() => navigation.navigate('ItemView', { item: item })}
        >
            <View className="w-full items-center border-b border-gray-500 w-full pl-1 pr-2 justify-between flex flex-row">
                <View className=" w-[20%] bg-yellow-500 justify-center items-center h-10 w-16 mb-1 rounded-lg">
                    {item.imagePath ? (
                        <FastImage
                            source={{ uri: item.imagePath, priority: FastImage.priority.high }}
                            style={{ width: 64, height: 40, borderRadius: 8 }}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    ) : (
                        <Text className="text-white text-xs text-center">No Image</Text>
                    )}
                </View>
                <Text className="w-[60%] text-xs font-bold text-start ml-1 mr-1">{truncateName(item.name.toUpperCase())}</Text>
                <Text className=" w-[20%] text-xs font-bold mb-1 text-right" numberOfLines={1}>₱ {item.price}</Text>
            </View>
        </TouchableOpacity>
    ));

    const renderItem = useCallback(({ item }: { item: ItemHQDto }) => <ProductItem item={item} />, []);
    const keyExtractor = useCallback((item: ItemHQDto) => item.id.toString(), []);

    return (
        <View className='flex flex-1'>
            {isSidebarVisible && (
                <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}

            <View className="top-3 flex flex-row justify-between px-2 mb-3">
                <TouchableOpacity className="bg-gray mt-1 ml-2" onPress={toggleSidebar}>
                    <Menu width={20} height={20} color="#fe6500" />
                </TouchableOpacity>
                <Text className="text-black text-lg font-bold">ITEMS DATA</Text>
                <View className="items-center mr-2">
                    <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                        <Text className="text-white" style={{ fontSize: 12 }}>
                            {truncateShortName(user?.name ? user.name.split(' ')[0].toUpperCase() : '')}
                        </Text>
                    </View>
                </View>
            </View>
            <View className="justify-center items-center bg-gray relative mt-1">
                {loadingCategory ? (
                    <ActivityIndicator size="small" color="#fe6500" />
                ) : (
                    <View className="w-[90%] flex-row justify-between pr-4 pl-4">
                        {categories.map((category) => (
                            <TouchableOpacity
                                onPress={() => handleCategoryClick(category.id)}
                                key={category.id}
                                className="rounded-full mx-1"
                            >
                                <Text className={`${activeCategory === category.id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium`}>
                                    {category.name.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <View className="w-full h-[2px] bg-gray-500 mt-1"></View>
            </View>
            <View className="flex-1 items-center">
                <View className="flex flex-row w-full bg-gray-300 py-1 px-3 justify-between items-center">
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
                                setSearch(text);
                                setLoading(true)
                                setPage(1);
                            }}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                    <TouchableOpacity className="mr-2" onPress={() => navigation.navigate('ItemView', { item: newItem })}>
                        <PlusCircle width={18} height={18} color="#fe6500" />
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-[#fe6500] mt-2">Loading Items...</Text>
                    </View>
                ) : (
                    <View className='w-full px-1'>
                        <OptimizedFlatList
                            data={products}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={keyExtractor}
                            numColumns={1}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            onEndReached={loadMoreCategories}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={loadingMore && <ActivityIndicator size="small" color="#fe6500" />}
                        />
                    </View>
                )}
            </View>
        </View>
    );
};
export default ItemListScreen;