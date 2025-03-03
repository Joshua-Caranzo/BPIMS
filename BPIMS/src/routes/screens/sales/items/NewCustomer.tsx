import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Camera, ChevronLeft } from 'react-native-feather';
import { CameraOptions, ImageLibraryOptions, launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { CustomerDto } from '../../../types/customerType';
import { saveCustomer } from '../../../services/customerRepo';
import { updateCustomer } from '../../../services/salesRepo';
import { ItemStackParamList } from '../../../navigation/navigation';

type Props = NativeStackScreenProps<ItemStackParamList, 'NewCustomer'>;

const NewCustomerScreen = React.memo(({ route }: Props) => {
  const user = route.params.user;
  const customers = route.params.customers
  const [customer, setCustomer] = useState<CustomerDto>({
    id: 0,
    name: '',
    contactNumber1: null,
    contactNumber2: null,
    totalOrderAmount: 0,
    branchId: user.branchId,
    branch: user.branchName,
    fileUrl: null,
    fileName: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [nameExists, setNameExists] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);

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


  const handleImageSelect = useCallback(() => {
    const options: CameraOptions & ImageLibraryOptions = {
      mediaType: 'photo' as MediaType,
      quality: 1,
    };

    const handleResponse = (response: any) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('An error occurred while selecting an image.');
      } else if (response.assets && response.assets.length > 0) {
        setFileUrl(response.assets[0].uri || null);
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
      ...prevCustomer,
      name: text,
    }));

    const exists = customers.some(c => c.name.toLowerCase() === text.toLowerCase());
    setNameExists(exists);
  }, [customers]);

  const handleContactNumber1Change = useCallback((text: string) => {
    setCustomer((prevCustomer) => ({
      ...prevCustomer,
      contactNumber1: text,
    }));
  }, []);

  const handleContactNumber2Change = useCallback((text: string) => {
    setCustomer((prevCustomer) => ({
      ...prevCustomer,
      contactNumber2: text,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    setLoading(true);
    if (customer && user) {
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
          .padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;
        const firstName = customer.name?.split(' ')[0] || 'Unknown';
        formData.append('file', {
          uri: fileUrl,
          name: `${firstName}${formattedDate}.jpg`,
          type: 'image/jpeg',
        } as any);
      }
      const result = await saveCustomer(formData);
      await updateCustomer(result.data);
      setLoading(false);
      navigation.navigate('Payment', { user });
    }
  }, [customer, user, fileUrl, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fe6500" />
        <Text className="text-[#fe6500] mt-2">Saving Customer...</Text>
      </View>
    );
  }

  return (
    <View className="flex flex-1">
      <View className="top-3 flex flex-row justify-between px-2">
        <View className="flex flex-row">
          <TouchableOpacity
            className="bg-gray px-1 pb-2 ml-2"
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft height={28} width={28} color="#fe6500" />
          </TouchableOpacity>
          <Text className="text-black text-lg font-bold ml-3">NEW CUSTOMER</Text>
        </View>
      </View>
      <View className="w-full h-[2px] bg-gray-500 mt-2 mb-2"></View>
      <View className="px-4 w-full">
        <View className="w-full flex-row justify-between">
          <View className="flex-1">
            <Text className="text-gray-700 text-sm">Branch</Text>
            <Text className='pb-2 mb-2 text-[#fe6500]'>{customer.branch?.toUpperCase()}</Text>
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
            keyboardType='numeric'
            className="border-b border-gray-400 py-2 mb-2 text-black"
            placeholder="Contact Number 1"
            onChangeText={handleContactNumber1Change}
            placeholderTextColor="#8a8a8a"
            selectionColor="#fe6500"
          />
        </View>
        <View className='w-full'>
          <Text className="text-gray-700 text-sm font-bold">Contact Number 2</Text>
          <TextInput
            value={customer.contactNumber2 || ''}
            editable={true}
            keyboardType='numeric'
            className="border-b border-gray-400 py-2 mb-2 text-black"
            placeholder="Contact Number 2"
            onChangeText={handleContactNumber2Change}
            placeholderTextColor="#8a8a8a"
            selectionColor="#fe6500"
          />
        </View>
      </View>
      {!keyboardVisible && (
        <View className="items-center absolute bottom-0 left-0 right-0 pb-2">
          <TouchableOpacity
            onPress={handleSave}
            className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
            disabled={!isValid}
          >
            <View className="flex-1 items-center">
              <Text className={`font-bold ${!isValid ? 'text-[#fe6500]' : 'text-white'} text-lg`}>SAVE</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default NewCustomerScreen;