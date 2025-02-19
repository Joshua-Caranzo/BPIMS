import { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, TextInput, ScrollView, Text } from 'react-native';
import React from 'react';
import { CustomerListDto } from '../../../types/customerType';
import { getUserDetails } from '../../../utils/auth';
import { getCustomerList } from '../../../services/customerRepo';
import FullScreenLoader from '../../../../components/FullScreenLoader';
import Sidebar from '../../../../components/Sidebar';
import { UserDetails } from '../../../types/userType';
import { ChevronLeft, Menu, PlusCircle, Search } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ItemStackParamList } from '../../../navigation/navigation';
import { updateCustomer } from '../../../services/salesRepo';

export default function CustomerListScreen() {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState<string>("");
    const [branchId, setBranchId] = useState<number | null>(null);
    const [customers, setCustomers] = useState<CustomerListDto[]>([]);
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();

    const toggleSidebar = () => {
        setSidebarVisible(!isSidebarVisible);
    };

    useEffect(() => {
        async function getCustomers() {
            setLoading(true);
            const user = await getUserDetails();
            setUser(user)
            if (user)
                setBranchId(user.branchId)
            const response = await getCustomerList(branchId, search);
            if (response)
                setCustomers(response.data);
            setLoading(false);
        }
        getCustomers();
    }, [branchId, search]);

    function handleSearchClick() {
        inputRef.current?.focus();
    }

    async function updateCustomerCart(id: number) {
        await updateCustomer(id);
        navigation.navigate("Payment")
    }

    function navigateToUser() {
        if (user) {
            navigation.navigate('NewCustomer', { user })
        }
    }

    return (
        <View style={{ flex: 1 }}>
            {user && (
                <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <View className='top-3 flex flex-row justify-between px-2'>
                <TouchableOpacity
                    className="bg-gray px-1 pb-2 ml-2"
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft height={28} width={28} color={"#fe6500"} />
                </TouchableOpacity>
                <Text className="text-black text-lg font-bold">Customers</Text>
                <View className=" items-center mr-2"
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
            <View className="justify-center items-center bg-gray relative mt-2 pb-8">
                <View className="flex flex-row w-full bg-gray-300 mt-1 py-1 px-3 justify-between items-center">
                    <View className="flex-row items-center rounded-md px-2 flex-1">
                        <TouchableOpacity className='mr-2' onPress={handleSearchClick}>
                            <Search width={20} height={20} color="black" />
                        </TouchableOpacity>

                        <TextInput
                            className="flex-1 h-8 text-black p-1"
                            placeholder=""
                            placeholderTextColor="#8a8a8a"
                            value={search}
                            onChangeText={setSearch}
                            ref={inputRef}
                            selectionColor="orange"
                            returnKeyType="search"
                        />
                    </View>

                    <TouchableOpacity className='mr-2' onPress={navigateToUser} >
                        <PlusCircle width={18} height={18} color="#fe6500" />
                    </TouchableOpacity>
                </View>
                {loading && <FullScreenLoader message={'Loading Customers...'} />}

                {!loading && (
                    <ScrollView className="w-full mb-8">
                        {customers.length > 0 && (
                            customers.map((customer) => (
                                <TouchableOpacity
                                    onPress={() => updateCustomerCart(customer.id)}
                                    key={customer.id}
                                    className="bg-gray py-2 px-4 border-b border-gray-300 flex flex-row justify-between"
                                >
                                    <Text className="text-black text-base">{customer.name}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}
            </View>

        </View >
    );
}
