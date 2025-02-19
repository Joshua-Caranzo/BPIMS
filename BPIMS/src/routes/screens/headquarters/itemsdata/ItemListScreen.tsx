import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Image, Alert, TouchableOpacity, Dimensions, TextInput, Keyboard, ActivityIndicator } from 'react-native';
import { CategoryDto, ItemDto } from '../../../types/salesType';
import { getCategories } from '../../../services/salesRepo';
import { Search, Menu } from "react-native-feather";
import { getUserDetails } from '../../../utils/auth';
import { UserDetails } from '../../../types/userType';
import Sidebar from '../../../../components/Sidebar';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ItemStackParamList } from '../../../navigation/navigation';
import { OptimizedFlatList } from 'react-native-optimized-flatlist';
import { getProductsHQ } from '../../../services/itemsHQRepo';
import { ItemHQDto } from '../../../types/itemType';
import HQSidebar from '../../../../components/HQSidebar';

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

    const toggleSidebar = () => setSidebarVisible(prev => !prev);

    useEffect(() => {
        const getCategoryList = async () => {
            setLoadingCategory(true);
            const response = await getCategories();
            if (response.isSuccess) {
                setCategories(response.data);
            } else {
                Alert.alert('An error occurred', response.message);
            }
            setLoadingCategory(false);
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
        if (activeCategory !== lastCategory) {
            setProducts([]);
        }
        if (!loadingMore)
            setLoading(true);
        const userResponse = await getUserDetails();
        setUser(userResponse)
        const response = await getProductsHQ(categoryId, page, search.trim());
        if (response.isSuccess) {
            const newProducts = response.data;
            setProducts(prevProducts => page === 1 ? newProducts : [...prevProducts, ...newProducts]);
            if (newProducts.length === 0 || products.length + newProducts.length >= (response.totalCount || 0)) {
                setHasMoreData(false);
            } else {
                setHasMoreData(true);
            }
        } else {
            setProducts([])
        }
        setLoading(false);
        setLoadingMore(false);
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
        >
            <View className="w-full items-center border-b border-gray-500 w-full pl-1 pr-2 justify-between flex flex-row">
                <View className=" w-[20%] bg-yellow-500 justify-center items-center h-10 w-16 mb-1 rounded-lg">
                    {item.imagePath ? (
                        <Image source={{ uri: item.imagePath }} className="w-full h-full object-cover" />
                    ) : (
                        <Text className="text-white text-xs text-center">No Image</Text>
                    )}
                </View>
                <Text className="w-[60%] text-xs font-bold text-start ml-1 mr-1" numberOfLines={1} ellipsizeMode="tail">{item.name.toUpperCase()}</Text>
                <Text className=" w-[20%] text-xs font-bold mb-1 text-right" numberOfLines={1}>₱ {item.price}</Text>
            </View>
        </TouchableOpacity>
    ));

    const renderItem = useCallback(({ item }: { item: ItemDto }) => <ProductItem item={item} />, []);
    const keyExtractor = useCallback((item: ItemDto) => item.id.toString(), []);

    return (
        <View style={{ flex: 1 }}>
            {isSidebarVisible && (
                <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}

            <View className='top-3 flex flex-row justify-between mb-4 px-2'>
                <TouchableOpacity
                    className="bg-gray mt-1 ml-2"
                    onPress={toggleSidebar}
                    style={{ zIndex: 999 }}
                >
                    <Menu width={20} height={20} color="#fe6500" />
                </TouchableOpacity>
                <View className=" mr-1 flex-row items-center w-[60%] sm:w-[75%] md:w-[80%] rounded-full border border-[#fe6500]">
                    <TextInput
                        className="flex-1 h-6 px-2 py-1 text-black"
                        placeholder="Search..."
                        placeholderTextColor="#8a8a8a"
                        value={search}
                        onChangeText={(text) => {
                            setLoading(true)
                            setSearch(text);
                            setPage(1);
                        }}
                        onFocus={() => Keyboard.isVisible()}
                        ref={inputRef}
                        selectionColor="orange"
                    />
                    <TouchableOpacity className='mr-2' onPress={handleSearchClick} >
                        <Search width={15} height={15} color="black" />
                    </TouchableOpacity>

                </View>
                <View className=" items-center"
                >
                    <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                        <Text
                            className="text-white"
                            style={{
                                fontSize: user?.name && user.name.split(" ")[0].length > 8 ? 10 : 12,
                            }}
                        >
                            {user?.name ? user.name.split(" ")[0].toUpperCase() : ""}
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
                <View className="w-full h-[2px] bg-gray-500 mt-1 mb-2"></View>
            </View>
            <View className="flex-1 w-full">
                {loading ? (
                    <ActivityIndicator size="large" color="#fe6500" />
                ) : (
                    <OptimizedFlatList
                        data={products}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        numColumns={1}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        onEndReached={loadMoreCategories}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={loadingMore && <ActivityIndicator size="small" color="#fe6500" />}
                    />
                )
                }
            </View>
        </View >
    );
};
export default ItemListScreen;