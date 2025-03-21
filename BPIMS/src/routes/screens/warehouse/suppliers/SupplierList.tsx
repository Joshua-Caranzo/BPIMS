import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Text,
    ActivityIndicator,
} from 'react-native';
import { getUserDetails } from '../../../utils/auth';
import { ObjectDto, UserDetails } from '../../../types/userType';
import { ChevronRight, Menu, PlusCircle, Search } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SupplierParamList } from '../../../navigation/navigation';
import { getSupplierList } from '../../../services/whRepo';
import WHSidebar from '../../../../components/WHSidebar';
import { truncateName, truncateShortName } from '../../../utils/dateFormat';

const SupplierListScreen = React.memo(() => {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [supplier, setSuppliers] = useState<ObjectDto[]>([]);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<SupplierParamList>>();

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const fetchSuppliers = useCallback(async () => {
        try {
            setLoading(true);
            const userDetails = await getUserDetails();
            setUser(userDetails);

            const response = await getSupplierList(search);
            if (response) {
                setSuppliers(response.data);
            }
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleSearchClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const handleViewSupplier = useCallback((id: number | null) => {
        navigation.navigate('SupplierView', { id: id || 0, suppliers: supplier });
    }, [navigation, supplier]);

    const filteredSuppliers = useMemo(() => {
        return supplier.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [supplier, search]);

    return (
        <View className='flex flex-1'>
            {user && (
                <WHSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <View className="top-3 flex flex-row justify-between px-2">
                <TouchableOpacity className="bg-gray mt-1 ml-2" onPress={toggleSidebar}>
                    <Menu width={20} height={20} color="#fe6500" />
                </TouchableOpacity>
                <Text className="text-black text-lg font-bold">SUPPLIER</Text>
                <View className="items-center mr-2">
                    <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                        <Text className="text-white" style={{ fontSize: 12 }}>
                            {truncateShortName(user?.name ? user.name.split(' ')[0].toUpperCase() : '')}
                        </Text>
                    </View>
                </View>
            </View>
            <View className="justify-center items-center bg-gray relative mt-4 mb-6">
                <View className="flex flex-row w-full bg-gray-300 mt-1 py-1 px-3 justify-between items-center">
                    <View className="flex-row items-center rounded-md px-2 flex-1">
                        <TouchableOpacity className="mr-2" onPress={handleSearchClick}>
                            <Search width={20} height={20} color="black" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 h-8 text-black p-1"
                            placeholder="Search supplier..."
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={setSearch}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>
                    <TouchableOpacity className="mr-2" onPress={() => handleViewSupplier(null)}>
                        <PlusCircle width={18} height={18} color="#fe6500" />
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <View className="py-2">
                        <ActivityIndicator size="small" color="#fe6500" />
                        <Text className="text-center text-[#fe6500]">Loading Suppliers...</Text>
                    </View>
                ) : (
                    <ScrollView className="w-full mb-8">
                        {filteredSuppliers.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                onPress={() => handleViewSupplier(s.id)}
                                className="bg-gray py-2 px-4 border-b border-gray-300 flex flex-row justify-between"
                            >
                                <Text className="text-black text-base">{truncateName(s.name)}</Text>
                                <View className="px-2">
                                    <ChevronRight color="#fe6500" height={20} width={20} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
});

export default SupplierListScreen;