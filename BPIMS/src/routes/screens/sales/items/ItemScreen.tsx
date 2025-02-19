import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, Image, Alert, TouchableOpacity, Dimensions, TextInput, Keyboard, ActivityIndicator } from 'react-native';
import { Cart, CategoryDto, ItemDto } from '../../../types/salesType';
import { addItemToCart, getCart, getCategories, getProducts } from '../../../services/salesRepo';
import { ChevronRight, Search, Menu, Slash, ChevronLeft } from "react-native-feather";
import { getUserDetails } from '../../../utils/auth';
import { UserDetails } from '../../../types/userType';
import Sidebar from '../../../../components/Sidebar';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ItemStackParamList } from '../../../navigation/navigation';
import { OptimizedFlatList } from 'react-native-optimized-flatlist';
import NumericKeypad from '../../../../components/NumericKeypad';
import { debounce } from 'lodash';

const ItemScreen = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ItemDto[]>([]);
    const [activeCategory, setActiveCategory] = useState(0);
    const [lastCategory, setLastCategory] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingCategory, setLoadingCategory] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
    const [search, setSearch] = useState("");
    const [hasMoreData, setHasMoreData] = useState(true);
    const [totalCartItems, setTotalCartItems] = useState(0);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isInputMode, setInputMode] = useState(false);
    const [quantity, setQuantity] = useState<string>("0.00");
    const [selectedItem, setSelectedItem] = useState<ItemDto>();
    const [buttonLoading, setButtonLoading] = useState<boolean>(false);

    const inputRef = useRef<TextInput>(null);

    const screenWidth = Dimensions.get('window').width;
    const itemWidth = screenWidth / 3 - 10;

    const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();

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
            getUserAndCart();
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
        const response = await getProducts(categoryId, page, search.trim(), Number(userResponse?.branchId));
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

    const getUserAndCart = async () => {
        const result = await getCart();
        setTotalCartItems(result.totalCount ?? 0);
        setTotalPrice(parseFloat(result.data.cart.subTotal.toString()));
    };

    const debouncedAddToCart = useCallback(debounce(async (item: ItemDto) => {
        if (item.sellbyUnit === false) {
            setSelectedItem(item);
            setInputMode(true);
        } else {
            const updatedItem = {
                ...item,
                quantity: item.quantity > 0 ? item.quantity - 1 : 0,
            };

            setTotalCartItems(prev => prev + 1);
            setTotalPrice(prev => prev + parseFloat(updatedItem.price.toString()));
            try {
                await addItemToCart(updatedItem.id, 1);
            } catch (error) {
                setProducts(prev =>
                    prev.map(i => (i.id === updatedItem.id ? updatedItem : i))
                );
                setTotalCartItems(prev => prev - 1);
                setTotalPrice(prev => prev - parseFloat(updatedItem.price.toString()));
            }
        }
    }, 300), []);

    async function addToCartFaction() {
        setButtonLoading(true)
        if (selectedItem) {
            const updatedItem = {
                ...selectedItem,
                quantity: selectedItem.quantity > 0 ? selectedItem.quantity - Number(quantity) : 0,
            };
            const toAdd = updatedItem.price * Number(quantity);
            setTotalCartItems(prev => prev + 1);
            setTotalPrice(prev => prev + parseFloat(toAdd.toString()));
            try {
                await addItemToCart(selectedItem.id, Number(quantity));
                setSelectedItem(undefined);
                setQuantity("0.00")
                setInputMode(false)
                await getUserAndCart();
            } catch (error) {
                setProducts(prev => prev.map(i => (i.id === selectedItem.id ? selectedItem : i)));
                setTotalCartItems(prev => prev - 1);
                setTotalPrice(prev => prev - parseFloat(selectedItem.price.toString()));
            }
        }
        setButtonLoading(false);
    }

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

    const handleCartClick = () => {
        setButtonLoading(true)
        navigation.navigate('Cart');
        setButtonLoading(false)
    };

    const ProductItem = React.memo(({ item }: { item: ItemDto }) => (
        <TouchableOpacity
            className={`m-1 ${item.quantity < 1 ? 'opacity-50' : 'opacity-100'}`}
            style={{ width: itemWidth }}
            onPress={() => debouncedAddToCart(item)}
            disabled={item.quantity < 1}
        >
            <View className="bg-gray-600 w-full aspect-[1] rounded-t-lg overflow-hidden justify-center items-center relative">
                {item.imagePath ? (
                    <Image source={{ uri: item.imagePath }} className="w-full h-full object-cover" />
                ) : (
                    <Text className="text-white text-xs text-center">No Image</Text>
                )}
                {item.quantity < 1 && (
                    <View className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 justify-center items-center">
                        <Text className="text-red-500 text-lg font-bold">Out of Stock</Text>
                        <Slash width={20} height={20} color="red" />
                    </View>
                )}
            </View>

            <View className="bg-yellow-500 w-full h-14 rounded-b-lg p-2 justify-between">
                <Text className="text-xs font-bold" numberOfLines={2} ellipsizeMode="tail">{item.name.toUpperCase()}</Text>
                <Text className="text-xs font-bold mb-1" numberOfLines={1}>₱ {item.price}</Text>
            </View>
        </TouchableOpacity>
    ));

    const renderItem = useCallback(({ item }: { item: ItemDto }) => <ProductItem item={item} />, []);
    const keyExtractor = useCallback((item: ItemDto) => item.id.toString(), []);

    const handleKeyPress = (key: string) => {
        let current = quantity.replace('.', '');
        current += key;
        if (current.length > 4) return;
        const formatted = (parseInt(current) / 100).toFixed(2);
        setQuantity(formatted);
    };

    const handleBackspace = () => {
        let current = quantity.replace('.', '');
        current = current.slice(0, -1) || '0';
        const formatted = (parseInt(current) / 100).toFixed(2);
        setQuantity(formatted);
    };

    return (
        <View style={{ flex: 1 }}>
            {isSidebarVisible && (
                <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            {isInputMode ? (
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
                            <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter Quantity Sold</Text>
                            <View className="flex flex-row items-center mt-6 w-48 border-b-2 border-[#fe6500] px-4 justify-center">
                                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                    {quantity}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                        <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                        <TouchableOpacity disabled={buttonLoading == true} onPress={addToCartFaction} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${quantity === "0.00" ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                        >
                            <View className="flex-1 flex flex-row items-center justify-center">
                                <Text className={`text-lg text-center font-bold ${quantity === "0.00" ? 'text-[#fe6500]' : 'text-white'}`}>
                                    Send to cart
                                </Text>
                                {buttonLoading && (
                                    <ActivityIndicator color={"white"} size={'small'} />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
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
                    <View className="flex-1">
                        {loading ? (
                            <ActivityIndicator size="large" color="#fe6500" />
                        ) : (
                            <OptimizedFlatList
                                data={products}
                                renderItem={renderItem}
                                keyExtractor={keyExtractor}
                                numColumns={3}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                onEndReached={loadMoreCategories}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={loadingMore && <ActivityIndicator size="small" color="#fe6500" />}
                            />
                        )
                        }
                    </View>
                    {!loading && products.length !== 0 && (
                        <View className="items-center pb-3 pt-2 bg-white">
                            <TouchableOpacity
                                onPress={handleCartClick}
                                className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${totalCartItems === 0 ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                                disabled={totalCartItems == 0 || buttonLoading == true}>
                                <View className="flex-1 items-center ml-4">
                                    <Text className={`font-bold text-lg ${totalCartItems === 0 ? 'text-[#fe6500]' : 'text-white'}`}>
                                        {totalCartItems === 0
                                            ? 'No Items'
                                            : `${totalCartItems} ${totalCartItems > 1 ? 'Items' : 'Item'}`} = ₱ {totalPrice.toFixed(2) || 0}
                                    </Text>
                                </View>
                                {totalCartItems > 0 && (
                                    buttonLoading ? (
                                        <ActivityIndicator color={"white"} size={'small'} />
                                    ) : (
                                        <ChevronRight height={24} width={24} color="white" />
                                    )
                                )}

                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )
            }
        </View >
    );
};
export default ItemScreen;