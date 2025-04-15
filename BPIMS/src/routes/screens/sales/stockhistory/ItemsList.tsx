import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ExternalLink, Search } from "react-native-feather";
import { OptimizedFlatList } from 'react-native-optimized-flatlist';
import ExpandableText from '../../../../components/ExpandableText';
import Sidebar from '../../../../components/Sidebar';
import TitleHeaderComponent from '../../../../components/TitleHeaderComponent';
import { HistoryStackParamList } from '../../../navigation/navigation';
import { getCategoriesHQ } from '../../../services/itemsHQRepo';
import { getProducts } from '../../../services/salesRepo';
import { CategoryDto, ItemDto } from '../../../types/salesType';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';

const ItemListScreen = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ItemDto[]>([]);
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
    const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();

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
            if (userResponse?.branchId) {
                const response = await getProducts(categoryId, page, search.trim(), userResponse?.branchId,);

                if (response.isSuccess) {
                    let newProducts = response.data;

                    setProducts(prevProducts => page === 1 ? newProducts : [...prevProducts, ...newProducts]);

                    setHasMoreData(newProducts.length > 0 && products.length + newProducts.length < (response.totalCount || 0));
                } else {
                    setProducts([]);
                }
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

    const handleHistoryView = useCallback(
        async (item: ItemDto) => {

            const userResponse = await getUserDetails();
            setUser(userResponse);

            if (userResponse) {
                navigation.navigate('HistoryView', {
                    branchItemId: item.branchItemId || 0,
                    itemName: item.name,
                    user: userResponse,
                });
            }
        },
        [navigation]
    );

    const ProductItem = React.memo(({ item }: { item: ItemDto }) => (
        <TouchableOpacity onPress={() => handleHistoryView(item)}
            className={`m-1 w-full pl-1 pr-3`}
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
                <View className='flex-1 ml-4'>
                    <ExpandableText className={'text-right'} text={item.name}></ExpandableText>
                </View>
                <TouchableOpacity onPress={() => handleHistoryView(item)}>
                    <ExternalLink height={16} width={16} color={'#fe6500'} ></ExternalLink>
                </TouchableOpacity>
            </View>
        </TouchableOpacity >
    ));

    const renderItem = useCallback(({ item }: { item: ItemDto }) => <ProductItem item={item} />, []);
    const keyExtractor = useCallback((item: ItemDto) => item.id.toString(), []);

    return (
        <View className='flex flex-1'>
            {isSidebarVisible && (
                <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <TitleHeaderComponent isParent={true} userName={user?.name || ''} title={'Stock History'} onPress={toggleSidebar}></TitleHeaderComponent>

            {loadingCategory ? (
                <ActivityIndicator size="small" color="#fe6500" />
            ) : (
                <View className="w-full justify-center items-center bg-gray relative">
                    <View className="w-full flex-row justify-between items-center">
                        {categories.map((category) => (
                            <TouchableOpacity
                                onPress={() => handleCategoryClick(category.id)}
                                key={category.id}
                                className={`${activeCategory === category.id ? 'border-b-4 border-yellow-500' : ''} flex-1 justify-center items-center p-2`}
                            >
                                <Text className={`${activeCategory === category.id ? 'text-gray-900' : 'text-gray-500'} text-[9px] font-medium text-center`}
                                >
                                    {category.name.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
            <View className="w-full h-[2px] bg-gray-500"></View>

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