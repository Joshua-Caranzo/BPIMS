import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Text,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, PlusCircle, Search } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerListDto } from '../../../types/customerType';
import { getCustomerList } from '../../../services/customerRepo';
import Sidebar from '../../../../components/Sidebar';
import { updateCustomer } from '../../../services/salesRepo';
import { ItemStackParamList } from '../../../navigation/navigation';

type Props = NativeStackScreenProps<ItemStackParamList, 'CustomerList'>;

const CustomerListScreen = React.memo(({ route }: Props) => {
  const user = route.params.user;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerListDto[]>([]);
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => !prev);
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const response = await getCustomerList(user.branchId, search);
    if (response) {
      setCustomers(response.data);
    }
    setLoading(false);
  }, [user, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const updateCustomerCart = useCallback(async (id: number) => {
    await updateCustomer(id);
    if (user)
      navigation.navigate('Payment', { user });
  }, [navigation, user]);

  const navigateToUser = useCallback(() => {
    if (user) {
      navigation.navigate('NewCustomer', { user, customers: customers });
    }
  }, [user, navigation]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);


  return (
    <View style={{ flex: 1 }}>
      {user && (
        <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
      )}
      <View className="top-3 flex flex-row justify-between px-2">
        <TouchableOpacity
          className="bg-gray px-1 pb-2 ml-2"
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft height={28} width={28} color="#fe6500" />
        </TouchableOpacity>
        <Text className="text-black text-lg font-bold">CUSTOMERS</Text>
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
      <View className="justify-center items-center bg-gray relative mt-2 pb-8">
        <View className="flex flex-row w-full bg-gray-300 mt-1 py-1 px-3 justify-between items-center">
          <View className="flex-row items-center rounded-md px-2 flex-1">
            <TouchableOpacity className="mr-2" onPress={handleSearchClick}>
              <Search width={20} height={20} color="black" />
            </TouchableOpacity>
            <TextInput
              className="flex-1 h-8 text-black p-1"
              placeholder="Search customers..."
              placeholderTextColor="#8a8a8a"
              value={search}
              onChangeText={setSearch}
              ref={inputRef}
              selectionColor="orange"
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity className="mr-2" onPress={navigateToUser}>
            <PlusCircle width={18} height={18} color="#fe6500" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View className="py-2">
            <ActivityIndicator size="small" color="#fe6500" />
            <Text className="text-[#fe6500] mt-2">Loading Customers...</Text>
          </View>
        ) : (
          <ScrollView className="w-full mb-8">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  onPress={() => updateCustomerCart(customer.id)}
                  className="bg-gray py-2 px-4 border-b border-gray-300 flex flex-row justify-between"
                >
                  <Text className="text-black text-base">{customer.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-center text-sm text-gray-500 mt-4">
                No customers found.
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
});

export default CustomerListScreen;