import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    Keyboard,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { CustomerDto, OrderHistory } from '../../../types/customerType';
import { deleteCustomer, getCustomer, saveCustomer } from '../../../services/customerRepo';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerHQStackParamList } from '../../../navigation/navigation';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, CameraOptions, ImageLibraryOptions, MediaType } from 'react-native-image-picker';
import { Camera, ChevronLeft, Trash2 } from 'react-native-feather';
import { formatTransactionDate } from '../../../utils/dateFormat';
import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';

type Props = NativeStackScreenProps<CustomerHQStackParamList, 'CustomerView'>;

const CustomerViewScreen = React.memo(({ route }: Props) => {
    const { id } = route.params;
    const customers = route.params.customers
    const [customerId, setCustomerId] = useState<number>(Number(id));
    const [customer, setCustomer] = useState<CustomerDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [loaderMessage, setLoaderMessage] = useState<string>('Loading Customer Data...');
    const navigation = useNavigation<NativeStackNavigationProp<CustomerHQStackParamList>>();
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [nameExists, setNameExists] = useState<boolean>(false);
    const [isValid, setIsValid] = useState<boolean>(false);
    const MAX_FILE_SIZE = 2 * 1024 * 1024;

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    useEffect(() => {
        validateForm();
    }, [customer, nameExists]);

    function validateForm() {
        const isFormValid = (
            customer?.name !== "" &&
            !nameExists
        );
        setIsValid(isFormValid);
    }

    const fetchCustomer = useCallback(async () => {
        setLoading(true);
        FastImage.clearMemoryCache();
        FastImage.clearDiskCache();
        if (customerId != 0 && customerId != null) {
            const response = await getCustomer(customerId);
            if (response) {
                setCustomer(response.data.customer);
                setOrderHistory(response.data.orderHistory ?? []);
                setFileUrl(response.data.customer.fileName)
            }
        } else if (customerId == 0) {
            const newCustomer: CustomerDto = {
                id: 0,
                name: '',
                contactNumber1: null,
                contactNumber2: null,
                totalOrderAmount: 0,
                branchId: null,
                branch: null,
                fileUrl: null,
                fileName: null,
            };
            setCustomer(newCustomer);
        }
        setLoading(false);
    }, [customerId]);

    useEffect(() => {
        fetchCustomer();
    }, [fetchCustomer]);

    const handleImageSelect = useCallback(() => {
        const options: CameraOptions & ImageLibraryOptions = {
            mediaType: 'photo' as MediaType,
            quality: 0.1,
        };

        const handleResponse = async (response: any) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                console.error('ImagePicker Error:', response.errorMessage);
                Alert.alert('An error occurred while selecting an image.');
            } else if (response.assets && response.assets.length > 0) {
                const fileUri = response.assets[0].uri;

                const fileInfo = await RNFS.stat(fileUri.replace('file://', ''));
                const fileSize = fileInfo.size;

                if (fileSize > MAX_FILE_SIZE) {
                    Alert.alert(
                        'File Too Large',
                        `The selected image is too large (${(fileSize / 1024 / 1024).toFixed(2)} MB). Please select an image smaller than ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
                        [{ text: 'OK' }]
                    );
                    setFileUrl(null);
                } else {
                    setFileUrl(fileUri);
                }
            } else {
                Alert.alert('No image selected');
            }
        };

        Alert.alert(
            'Select Image',
            'Choose an option:',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Take Photo', onPress: () => launchCamera(options, handleResponse) },
                { text: 'Choose from Library', onPress: () => launchImageLibrary(options, handleResponse) },
            ],
            { cancelable: true }
        );
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
        if (customer) {
            const exists = customers.some(c => c.name.toLowerCase() === text.toLowerCase() && c.id !== customer.id);
            setNameExists(exists);
        }
        else if (!customer) {
            const exists = customers.some(c => c.name.toLowerCase() === text.toLowerCase());
            setNameExists(exists);
        }
    }, [customer]);

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
        if (customer) {
            setLoading(true);
            customer.branchId = null;
            const formData = new FormData();
            formData.append('id', String(customer.id));
            formData.append('name', customer.name);
            if (customer.contactNumber1 != null) formData.append('contactNumber1', customer.contactNumber1);
            if (customer.contactNumber2 != null) formData.append('contactNumber2', customer.contactNumber2);
            if (customer.branchId != null) formData.append('branchId', customer.branchId);
            if (fileUrl) {
                const today = new Date();
                const formattedDate = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;
                const firstName = customer.name?.split(' ')[0] || 'Unknown';
                formData.append('file', {
                    uri: fileUrl,
                    name: `${firstName}${formattedDate}.jpg`,
                    type: 'image/jpeg',
                } as any);
            }
            const result = await saveCustomer(formData);
            setLoading(false);
            setCustomerId(result.data)
            await fetchCustomer();
        }
    }, [customer, fileUrl, fetchCustomer]);

    const removeCustomer = useCallback(
        async (id: number) => {
            Alert.alert(
                'Confirm Deletion',
                'Are you sure you want to delete this customer?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Yes',
                        onPress: async () => {
                            setLoaderMessage('Deleting Customer...');
                            setLoading(true);
                            const response = await deleteCustomer(id);
                            if (response.isSuccess) {
                                navigation.push('Customer');
                            }
                        }
                    }
                ]
            );
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
                <ActivityIndicator size="small" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">{loaderMessage}</Text>
            </View>
        );
    }

    return (
        <View className="flex flex-1">
            <View className="top-3 flex flex-row justify-between px-2">
                <View className="flex flex-row">
                    <TouchableOpacity className="bg-gray px-1 pb-2 ml-2" onPress={() => navigation.navigate("Customer")}>
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
                                    value={customer.branch?.toUpperCase() || 'No Branch'}
                                    editable={false}
                                    className="pb-2 mb-2 text-[#fe6500]"
                                    placeholder="Branch Name"
                                />
                            </View>
                            <TouchableOpacity onPress={handleImageSelect}>
                                {fileUrl ? (
                                    <FastImage source={{ uri: fileUrl }} className="w-24 h-24 rounded-lg" />
                                ) : (
                                    <View className="w-24 h-24 bg-gray-500 rounded-lg justify-center items-center">
                                        <Camera color="white" height={32} width={32} />
                                        <Text className="text-white text-xs mt-1">Add Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View className='w-full mb-2'>
                            <Text className="text-gray-700 text-sm font-bold">Name</Text>
                            <TextInput
                                value={customer.name || ''}
                                editable={true}
                                className="border-b border-gray-400 py-2 text-black"
                                placeholder="Customer Name"
                                onChangeText={handleNameChange}
                                placeholderTextColor="#8a8a8a"
                                selectionColor="#fe6500"
                            />
                            {nameExists && (
                                <Text className="text-red-500 text-xs">
                                    This name already exists. Please use a different name.
                                </Text>
                            )}
                        </View>

                        <View className='w-full'>
                            <Text className="text-gray-700 text-sm font-bold">Contact Number 1</Text>
                            <TextInput
                                value={customer.contactNumber1 || ''}
                                editable={true}
                                className="border-b border-gray-400 py-2 mb-2 text-black"
                                placeholder="Contact Number 1"
                                onChangeText={handleContactNumber1Change}
                                placeholderTextColor="#8a8a8a"
                                selectionColor="#fe6500"
                                keyboardType='numeric'
                            />
                        </View>
                        <View className='w-full'>
                            <Text className="text-gray-700 text-sm font-bold">Contact Number 2</Text>
                            <TextInput
                                value={customer.contactNumber2 || ''}
                                editable={true}
                                className="border-b border-gray-400 py-2 mb-2 text-black"
                                placeholder="Contact Number 2"
                                onChangeText={handleContactNumber2Change}
                                placeholderTextColor="#8a8a8a"
                                selectionColor="#fe6500"
                                keyboardType='numeric'
                            />
                        </View>
                        {customer.id !== 0 && (
                            <View className='w-full'>
                                <Text className="text-gray-700 text-sm font-bold">Total Order Amount</Text>
                                <TextInput
                                    value={customer.totalOrderAmount ? `₱ ${customer.totalOrderAmount}` : ''}
                                    editable={false}
                                    className="border-b border-gray-400 py-2 mb-2"
                                    placeholder="Total Order Amount"
                                />
                            </View>
                        )}

                        {orderHistory.length > 0 && (
                            <View className="flex flex-column mt-2 h-[37vh] md:h-[50vh] lg:h-[60vh] pb-2">
                                <Text className="text-gray-700 text-sm font-bold">Order History</Text>
                                <ScrollView className="w-full mb-8 mt-1">
                                    <View className="flex flex-row justify-between border-b pb-2 mb-2 border-gray-300">
                                        <Text className="text-black text-xs font-semibold flex-1 text-left">Slip No</Text>
                                        <Text className="text-black text-xs font-semibold flex-1 text-center">Amount</Text>
                                        <Text className="text-black text-xs font-semibold flex-1 text-right">Date</Text>
                                    </View>

                                    {formattedOrderHistory.map((order) => (
                                        <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory', { transactionId: order.id })} key={order.id} className="flex flex-row justify-between py-1 border-b border-gray-200">
                                            <Text className="text-black text-xs flex-1 text-left">{order.slipNo}</Text>
                                            <Text className="text-black text-xs flex-1 text-right mr-8">₱ {order.totalAmount}</Text>
                                            <Text className="text-black text-xs flex-1 text-right">{order.formattedDate}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )
                        }
                    </>
                )}
            </View>
            {!keyboardVisible && (
                <View className="items-center absolute bottom-0 left-0 right-0 pb-2">
                    <TouchableOpacity
                        onPress={handleSave}
                        className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                        disabled={!isValid}
                    >
                        <View className="flex-1 flex flex-row items-center justify-center">
                            <Text className={`font-bold ${!isValid ? 'text-[#fe6500]' : 'text-white'} text-lg`}>SAVE</Text>
                            {loading && (
                                <ActivityIndicator size={'small'} color={'white'}></ActivityIndicator>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
});

export default CustomerViewScreen;