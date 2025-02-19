import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    Keyboard,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { CustomerDto, OrderHistory } from '../../../types/customerType';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { deleteCustomer, getCustomer, getCustomerImage, saveCustomer } from '../../../services/customerRepo';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../../navigation/navigation';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera, ChevronLeft, Trash2 } from 'react-native-feather';
import { formatTransactionDate } from '../../../utils/dateFormat';

type Props = NativeStackScreenProps<CustomerStackParamList, 'CustomerView'>;

const CustomerViewScreen = React.memo(({ route }: Props) => {
    const { id } = route.params;
    const [customer, setCustomer] = useState<CustomerDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [user, setUser] = useState<UserDetails>();
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [loaderMessage, setLoaderMessage] = useState<string>('Loading Customer Data...');
    const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();

    const fetchCustomer = useCallback(async () => {
        setLoading(true);
        const userDetails = await getUserDetails();
        setUser(userDetails);
        if (id != 0 && id != null) {
            const response = await getCustomer(id);
            if (response) {
                setCustomer(response.data.customer);
                setOrderHistory(response.data.orderHistory ?? []);
                if (response.data.customer.fileName) {
                    const imageResponse = await getCustomerImage(response.data.customer.fileName);
                    setFileUrl(imageResponse);
                }
            }
        } else if (id == 0 && userDetails) {
            const newCustomer: CustomerDto = {
                id: 0,
                name: '',
                contactNumber1: null,
                contactNumber2: null,
                totalOrderAmount: 0,
                branchId: userDetails.branchId,
                branch: userDetails.branchName,
                fileUrl: null,
                fileName: null,
            };
            setCustomer(newCustomer);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        fetchCustomer();
    }, [fetchCustomer]);

    const handleImageSelect = useCallback(() => {
        launchImageLibrary({ mediaType: 'photo', quality: 1 }, (response) => {
            if (response.didCancel) {
                return;
            }
            if (response.errorCode) {
                console.error('ImagePicker Error: ', response.errorMessage);
                Alert.alert('An error occurred while selecting image.');
            } else if (response.assets && response.assets.length > 0) {
                setFileUrl(response.assets[0].uri || null);
            } else {
                Alert.alert('No image selected');
            }
        });
    }, []);

    const handleNameChange = useCallback((text: string) => {
        setCustomer((prevCustomer) => ({
            ...(prevCustomer ?? {
                id: 0,
                name: '',
                contactNumber1: '',
                contactNumber2: '',
                totalOrderAmount: 0,
                branchId: null,
                branch: '',
                fileUrl: null,
                fileName: null,
            }),
            name: text,
        }));
    }, []);

    const handleContactNumber1Change = useCallback((text: string) => {
        setCustomer((prevCustomer) => ({
            ...(prevCustomer ?? {
                id: 0,
                name: '',
                contactNumber1: '',
                contactNumber2: '',
                totalOrderAmount: 0,
                branchId: null,
                branch: '',
                fileUrl: null,
                fileName: null,
            }),
            contactNumber1: text,
        }));
    }, []);

    const handleContactNumber2Change = useCallback((text: string) => {
        setCustomer((prevCustomer) => ({
            ...(prevCustomer ?? {
                id: 0,
                name: '',
                contactNumber1: '',
                contactNumber2: '',
                totalOrderAmount: 0,
                branchId: null,
                branch: '',
                fileUrl: null,
                fileName: null,
            }),
            contactNumber2: text,
        }));
    }, []);

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        setLoaderMessage('Saving Customer...');
        if (customer && user) {
            setLoading(true);
            customer.branchId = user.branchId;

            const formData = new FormData();
            formData.append('id', String(customer.id));
            formData.append('name', customer.name);
            if (customer.contactNumber1 != null) formData.append('contactNumber1', customer.contactNumber1);
            if (customer.contactNumber2 != null) formData.append('contactNumber2', customer.contactNumber2);
            formData.append('branchId', customer.branchId);
            if (fileUrl) {
                const today = new Date();
                const formattedDate = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`; // Format as DDMMYY
                const firstName = customer.name?.split(' ')[0] || 'Unknown';
                formData.append('file', {
                    uri: fileUrl,
                    name: `${firstName}${formattedDate}.jpg`,
                    type: 'image/jpeg',
                } as any);
            }
            const result = await saveCustomer(formData);
            setLoading(false);
            await fetchCustomer();
        }
    }, [customer, user, fileUrl, fetchCustomer]);

    const removeCustomer = useCallback(
        async (id: number) => {
            setLoaderMessage('Deleting Customer...');
            setLoading(true);
            const response = await deleteCustomer(id);
            if (response.isSuccess) {
                setLoading(false);
                navigation.navigate('Customer');
            }
        },
        [navigation]
    );

    const formattedOrderHistory = useMemo(() => {
        return orderHistory.map((order) => ({
            ...order,
            formattedDate: formatTransactionDate(order.transactionDate.toString()),
        }));
    }, [orderHistory]);

    if (loading) {
        return (
            <View className='flex flex-1 justify-center items-center mt-10'>
                <ActivityIndicator size="large" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">{loaderMessage}</Text>
            </View>
        );
    }

    return (
        <View className="flex flex-1">
            <View className="top-3 flex flex-row justify-between px-2">
                <View className="flex flex-row">
                    <TouchableOpacity className="bg-gray px-1 pb-2 ml-2" onPress={() => navigation.goBack()}>
                        <ChevronLeft height={28} width={28} color="#fe6500" />
                    </TouchableOpacity>
                    {customer && customer.id != 0 ? (
                        <Text className="font-bold text-base text-gray-700 ml-3">{customer.name}</Text>
                    ) : (
                        <Text className="font-bold text-base text-gray-700 ml-3">New Customer</Text>
                    )}
                </View>
                {customer && customer.id != 0 && (
                    <View>
                        <TouchableOpacity
                            onPress={() => removeCustomer(customer.id)}
                            className="rounded-full w-6 h-6 flex items-center justify-center mr-2"
                        >
                            <Trash2 height={20} width={20} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <View className="w-full h-[2px] bg-gray-500 mt-2 mb-2"></View>

            <View className="px-4 w-full">
                {customer && (
                    <>
                        <View className="w-full flex-row justify-between">
                            <View className="flex-1">
                                <Text className="text-gray-700 text-sm">Branch</Text>
                                <TextInput
                                    value={customer.branch?.toUpperCase() || ''}
                                    editable={false}
                                    className="pb-2 mb-2 text-[#fe6500]"
                                    placeholder="Branch Name"
                                />
                            </View>
                            <TouchableOpacity onPress={handleImageSelect}>
                                {fileUrl ? (
                                    <Image source={{ uri: fileUrl }} className="w-24 h-24 rounded-lg" />
                                ) : (
                                    <View className="w-24 h-24 bg-gray-500 rounded-lg justify-center items-center">
                                        <Camera color="white" height={32} width={32} />
                                        <Text className="text-white text-xs mt-1">Add Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            value={customer.name || ''}
                            editable={true}
                            className="border-b border-gray-400 py-2 mb-2 text-black"
                            placeholder="Customer Name"
                            onChangeText={handleNameChange}
                            placeholderTextColor="gray"
                        />

                        <TextInput
                            value={customer.contactNumber1 || ''}
                            editable={true}
                            className="border-b border-gray-400 py-2 mb-2 text-black"
                            placeholder="Contact Number 1"
                            onChangeText={handleContactNumber1Change}
                            placeholderTextColor="gray"
                        />
                        <TextInput
                            value={customer.contactNumber2 || ''}
                            editable={true}
                            className="border-b border-gray-400 py-2 mb-2 text-black"
                            placeholder="Contact Number 2"
                            onChangeText={handleContactNumber2Change}
                            placeholderTextColor="gray"
                        />
                        {customer.id !== 0 && (
                            <TextInput
                                value={customer.totalOrderAmount ? `Total Order Amount: ₱ ${customer.totalOrderAmount}` : ''}
                                editable={false}
                                className="border-b border-gray-400 py-2 mb-2"
                                placeholder="Total Order Amount"
                            />
                        )}
                        <View className="flex flex-column mt-2">
                            <Text className="text-gray-700 text-sm font-bold">Order History</Text>
                            <ScrollView className="w-full mb-8 mt-1">
                                {formattedOrderHistory.map((order) => (
                                    <View key={order.id} className="flex flex-row justify-between">
                                        <Text className="text-black text-xs">{order.slipNo}</Text>
                                        <Text className="text-black text-xs">₱ {order.totalAmount}</Text>
                                        <Text className="text-black text-xs">{order.formattedDate}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </>
                )}
            </View>
            <View className="items-center absolute bottom-0 left-0 right-0 pb-2" style={{ zIndex: 100 }}>
                <TouchableOpacity
                    className="w-[95%] rounded-xl p-5 items-center bg-[#fe6500]"
                    onPress={handleSave}
                >
                    <Text className="font-bold text-center text-white">SAVE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default CustomerViewScreen;