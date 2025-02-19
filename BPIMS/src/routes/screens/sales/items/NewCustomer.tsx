import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Alert, Keyboard } from 'react-native';
import { CustomerDto } from '../../../types/customerType';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { saveCustomer } from '../../../services/customerRepo';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ItemStackParamList } from '../../../navigation/navigation';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import FullScreenLoader from '../../../../components/FullScreenLoader';
import { Camera, ChevronLeft } from 'react-native-feather';
import { updateCustomer } from '../../../services/salesRepo';

type Props = NativeStackScreenProps<ItemStackParamList, 'NewCustomer'>;

export default function NewCustomerScreen({ route }: Props) {
    const user: UserDetails = route.params.user;

    const newCustomer: CustomerDto = {
        id: 0,
        name: '',
        contactNumber1: null,
        contactNumber2: null,
        totalOrderAmount: 0,
        branchId: user?.branchId,
        branch: user.branchName,
        fileUrl: null,
        fileName: null
    };

    const [customer, setCustomer] = useState<CustomerDto>(newCustomer);
    const [loading, setLoading] = useState<boolean>(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [loaderMessage, setLoaderMessage] = useState<string>('Loading Customer Data...');
    const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();

    async function handleImageSelect() {
        launchImageLibrary({ mediaType: 'photo', quality: 1 }, (response) => {
            if (response.didCancel) {
            } else if (response.errorCode) {
                console.error('ImagePicker Error: ', response.errorMessage);
                Alert.alert('An error occurred while selecting image.');
            } else if (response.assets && response.assets.length > 0) {
                setFileUrl(response.assets[0].uri || null);
            } else {
                Alert.alert('No image selected');
            }
        });
    };

    function handleNameChange(text: string) {
        setCustomer(prevCustomer => ({
            ...prevCustomer ?? {
                id: 0,
                name: '',
                contactNumber1: '',
                contactNumber2: '',
                totalOrderAmount: 0,
                branchId: null,
                branch: '',
                fileUrl: null,
                fileName: null
            },
            name: text,
        }));
    }

    function handleContactNumber1Change(text: string) {
        setCustomer(prevCustomer => ({
            ...prevCustomer ?? {
                id: 0,
                name: '',
                contactNumber1: '',
                contactNumber2: '',
                totalOrderAmount: 0,
                branchId: null,
                branch: '',
                fileUrl: null,
                fileName: null
            },
            contactNumber1: text,
        }));
    }

    function handleContactNumber2Change(text: string) {
        setCustomer(prevCustomer => ({
            ...prevCustomer ?? {
                id: 0,
                name: '',
                contactNumber1: '',
                contactNumber2: '',
                totalOrderAmount: 0,
                branchId: null,
                branch: '',
                fileUrl: null,
                fileName: null
            },
            contactNumber2: text,
        }));
    }

    async function handleSave() {
        Keyboard.dismiss();
        setLoaderMessage("Saving Customer...")
        if (customer && user) {
            setLoading(true);
            const formData = new FormData();
            formData.append('id', String(customer.id));
            formData.append('name', customer.name);
            if (customer.contactNumber1 != null)
                formData.append('contactNumber1', customer.contactNumber1);
            if (customer.contactNumber2 != null)
                formData.append('contactNumber2', customer.contactNumber2);
            formData.append('branchId', customer.branchId);
            if (fileUrl) {
                const today = new Date();
                const formattedDate = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`; // Format as DDMMYY
                const firstName = customer.name?.split(' ')[0] || 'Unknown';

                formData.append('file', {
                    uri: fileUrl,
                    name: `${firstName}${formattedDate}.jpg`,
                    type: 'image/jpeg',
                } as any);
            }
            customer.branchId = user?.branchId
            const result = await saveCustomer(formData);
            await updateCustomer(result.data)
            setLoading(false);
            navigation.navigate("Payment")
        }
    }

    if (loading) {
        return <FullScreenLoader message={loaderMessage} />;
    }

    return (
        <View className=" flex flex-1">
            <View className='top-3 flex flex-row justify-between px-2'>
                <View className='flex flex-row'>
                    <TouchableOpacity
                        className="bg-gray px-1 pb-2 ml-2"
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft height={28} width={28} color={"#fe6500"} />
                    </TouchableOpacity>

                    <Text className="font-bold text-base text-gray-700 ml-3">
                        New Customer
                    </Text>

                </View>
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
                                    <Image
                                        source={{ uri: fileUrl }}
                                        className="w-24 h-24 rounded-lg "
                                    />
                                ) : (
                                    <View className="w-24 h-24 bg-gray-500 rounded-lg justify-center items-center">
                                        <Camera color={"white"} height={32} width={32}></Camera>
                                        <Text className='text-white text-xs mt-1'>Add Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            value={customer.name || ''}
                            editable={true}
                            className="border-b border-gray-400 py-2 mb-2 text-black"
                            placeholder="Customer Name"
                            onChangeText={(value) => handleNameChange(value)}
                            placeholderTextColor="gray"

                        />

                        <TextInput
                            value={customer.contactNumber1 || ''}
                            editable={true}
                            className="border-b border-gray-400 py-2 mb-2 text-black"
                            placeholder="Contact Number 1"
                            onChangeText={(value) => handleContactNumber1Change(value)}
                            placeholderTextColor="gray"
                        />
                        <TextInput
                            value={customer.contactNumber2 || ''}
                            editable={true}
                            className="border-b border-gray-400 py-2 mb-2 text-black"
                            placeholder="Contact Number 2"
                            onChangeText={(value) => handleContactNumber2Change(value)}
                            placeholderTextColor="gray"

                        />
                    </>
                )}
            </View>
            <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                <TouchableOpacity className={`w-[95%] rounded-xl p-5 items-center bg-[#fe6500]`} onPress={handleSave}>
                    <Text className="font-bold text-center text-white">
                        SAVE
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
