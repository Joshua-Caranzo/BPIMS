import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Keyboard,
    Modal,
    FlatList,
    Alert,
    Switch,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { CategoryDto } from '../../../types/salesType';
import { ChevronLeft, Camera, XCircle, Trash2 } from "react-native-feather";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ItemsHQParamList } from '../../../navigation/navigation';
import { deleteItem, getCategoriesHQ, getProductHQ, saveItem } from '../../../services/itemsHQRepo';
import { ItemHQDto } from '../../../types/itemType';
import NumericKeypad from '../../../../components/NumericKeypad';
import { formatPrice } from '../../../utils/dateFormat';
import { CameraOptions, ImageLibraryOptions, launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';

type Props = NativeStackScreenProps<ItemsHQParamList, 'ItemView'>;

const ItemViewScreen = ({ route }: Props) => {
    const item: ItemHQDto = route.params.item;
    const [fileUrl, setFileUrl] = useState<string | null>(item.imageUrl);
    const navigation = useNavigation<NativeStackNavigationProp<ItemsHQParamList>>();
    const [isValid, setIsValid] = useState<boolean>(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [isInputMode, setInputMode] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<ItemHQDto>(item);
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [openCategories, setOpenCategories] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const scrollViewRef = useRef<ScrollView>(null);

    const fieldLabels: { [key: string]: string } = {
        name: 'Product Name',
        price: 'Selling Price',
        cost: 'Cost Price',
        category: 'Category',
        moq: 'MOQ',
        criticalValue: 'Critical Value',
        unitOfMeasure: 'Unit of Measure',
        sellbyUnit: 'Sell By Unit'
    };

    const fetchItem = useCallback(async () => {
        setLoading(true);
        FastImage.clearMemoryCache();
        FastImage.clearDiskCache();
        if (item.id !== 0) {
            setEditingItem(item);
        } else {
            const newItem: ItemHQDto = {
                id: 0,
                name: "",
                categoryId: 0,
                price: 0.00,
                cost: 0.00,
                isManaged: false,
                imagePath: null,
                sellbyUnit: false,
                moq: 0,
                categoryName: "",
                unitOfMeasure: "",
                criticalValue: 0,
                imageUrl: null
            };
            setEditingItem(newItem);
        }
        setLoading(false);
    }, [item]);

    useEffect(() => {
        fetchItem();
    }, [fetchItem]);

    useEffect(() => {
        validateForm();
    }, [editingItem]);

    useEffect(() => {
        const fetchCategories = async () => {
            const result = await getCategoriesHQ();
            setCategories(result.data);
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleChange = useCallback((key: keyof ItemHQDto, value: any) => {
        setEditingItem(prevItem => ({ ...prevItem, [key]: value }));
    }, []);

    const handleNumberChange = useCallback((field: string, value: string) => {
        setEditingItem(prevItem => ({ ...prevItem, [field]: isNaN(Number(value)) ? 0 : Number(value) }));
    }, []);

    const validateForm = useCallback(() => {
        const isFormValid = (
            editingItem?.name !== "" &&
            editingItem?.categoryId !== 0 &&
            editingItem?.price !== 0 &&
            editingItem?.cost !== 0 &&
            editingItem.criticalValue !== null &&
            editingItem.unitOfMeasure !== null &&
            editingItem.unitOfMeasure !== ""
        );
        setIsValid(isFormValid);
    }, [editingItem]);

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

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        setLoading(true);

        const formData = new FormData();
        Object.entries(editingItem).forEach(([key, value]) => formData.append(key, String(value)));

        if (fileUrl) {
            const today = new Date();
            const formattedDate = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;
            const firstName = editingItem.name?.split(' ')[0] || 'Unknown';
            formData.append('file', {
                uri: fileUrl,
                name: `${firstName}${formattedDate}.jpg`,
                type: 'image/jpeg',
            } as any);
        }
        const result = await saveItem(formData);

        const itemData = await getProductHQ(result.data)
        setEditingItem(itemData.data);
        setLoading(false);
    }, [editingItem, fileUrl]);

    const removeItem = useCallback(async (id: number) => {
        setLoading(true);
        const response = await deleteItem(id);
        if (response.isSuccess) {
            setLoading(false);
            navigation.navigate('Items');
        }
    }, [navigation]);

    const handleSwitchChange = useCallback((key: keyof ItemHQDto, value: any) => {
        setEditingItem((prevItem) => ({
            ...prevItem ?? {
                id: 0,
                name: "",
                categoryId: 1,
                price: 0,
                cost: 0,
                isManaged: false,
                imagePath: null,
                sellbyUnit: false,
                moq: 0,
                categoryName: "",
                unitOfMeasure: "",
                criticalValue: 0
            },
            [key]: value,
            moq: 0,
            criticalValue: 0
        }));
    }, []);

    const handleKeyPress = useCallback((key: string) => {
        if (editingField && editingItem) {
            if (editingField == 'price' || editingField == 'cost') {
                let current = (Number(editingItem?.[editingField] || 0).toFixed(2)).replace('.', '');
                current += key;
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
            else {
                if (editingItem.sellbyUnit) {
                    const currentValue = editingItem[editingField]?.toString() || '';
                    const newValue = currentValue + key;
                    handleNumberChange(editingField, newValue);
                }
                else {
                    let current = (Number(editingItem?.[editingField] || 0).toFixed(2)).replace('.', '');
                    current += key;
                    const formatted = (parseInt(current) / 100).toFixed(2);
                    handleNumberChange(editingField, formatted);
                }
            }
        };
    }, [editingField, editingItem, handleNumberChange]);

    const handleBackspace = useCallback(() => {
        if (editingField && editingItem) {
            if (editingField == 'price' || editingField == 'cost') {
                let current = (Number(editingItem?.[editingField] || 0).toFixed(2)).replace('.', '');
                current = current.slice(0, -1) || '0';
                const formatted = (parseInt(current) / 100).toFixed(2);
                handleNumberChange(editingField, formatted);
            }
            else {
                if (editingItem.sellbyUnit) {
                    const currentValue = editingItem[editingField]?.toString() || '';
                    const newValue = currentValue.slice(0, -1);
                    handleNumberChange(editingField, newValue);
                }
                else {
                    let current = (Number(editingItem?.[editingField] || 0).toFixed(2)).replace('.', '');
                    current = current.slice(0, -1) || '0';
                    const formatted = (parseInt(current) / 100).toFixed(2);
                    handleNumberChange(editingField, formatted);
                }
            }
        };
    }, [editingField, editingItem, handleNumberChange]);

    const closeModal = useCallback(() => setOpenCategories(false), []);

    const renderModal = useCallback((data: CategoryDto[]) => (
        <Modal transparent visible={openCategories} animationType="slide">
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white p-5 rounded-lg w-4/5 relative">
                    <TouchableOpacity className="absolute top-2 right-2 p-1" onPress={closeModal}>
                        <XCircle width={24} height={24} />
                    </TouchableOpacity>

                    <Text className="text-lg font-bold mb-2 text-center">
                        Select Category
                    </Text>

                    <FlatList
                        data={data.filter(item => item.id !== 0)}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="p-3 border-b border-gray-200"
                                onPress={() => {
                                    handleChange('categoryId', item.id);
                                    handleChange('categoryName', item.name);
                                    closeModal();
                                }}
                            >
                                <Text className="text-base">{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    ), [openCategories, closeModal, handleChange]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: keyboardVisible ? 50 : 0 }}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                <View className="flex flex-1">
                    {isInputMode && editingField ? (
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
                                    <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Enter {fieldLabels[editingField ?? 'qty']}
                                    </Text>

                                    <View className="flex flex-row items-center mt-6 w-48 border-b-2 border-[#fe6500] px-4 justify-center">
                                        <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                            {fieldLabels[editingField] == 'Cost Price' || fieldLabels[editingField] == 'Selling Price'
                                                ?
                                                `₱ ${Number(editingItem?.[editingField] || 0).toFixed(2)}`
                                                :
                                                (editingItem.sellbyUnit)
                                                    ? String(editingItem?.[editingField] || 0)
                                                    : `${Number(editingItem?.[editingField] || 0).toFixed(2)}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                                <TouchableOpacity disabled={!editingItem?.[editingField]} onPress={() => setInputMode(false)} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!editingItem?.[editingField] ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}>
                                    <View className="flex-1 flex flex-row items-center justify-center">
                                        <Text className={`text-lg text-center font-bold text-white ${!editingItem?.[editingField] ? 'text-[#fe6500]' : 'text-white'}`}>
                                            Done
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View className="flex flex-1">
                            <View className='top-3 flex flex-row justify-between px-2'>
                                <TouchableOpacity
                                    className="bg-gray px-1 pb-2 ml-2"
                                    onPress={() => navigation.push('Items')}
                                >
                                    <ChevronLeft height={28} width={28} color={"#fe6500"} />
                                </TouchableOpacity>
                                <View className='pr-4 flex-1 items-center'>
                                    <Text className="text-black text-lg font-bold mb-1">ITEMS DATA</Text>
                                </View>
                                {item && item.id != 0 && (
                                    <View>
                                        <TouchableOpacity
                                            onPress={() => removeItem(item.id)}
                                            className="rounded-full w-6 h-6 flex items-center justify-center mr-2"
                                        >
                                            <Trash2 height={20} width={20} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            <View className="px-4 w-full mt-6">
                                <View className="w-full flex items-center">
                                    <Text className="text-black text-sm">{editingItem.name}</Text>
                                    <TouchableOpacity className='w-full mt-2 items-center' onPress={handleImageSelect}>

                                        {fileUrl ? (
                                            <FastImage source={{
                                                uri: fileUrl, priority: FastImage.priority.high,
                                            }} className="w-24 h-24 rounded-lg" />
                                        ) : (
                                            <View className="w-full h-24 bg-gray-500 rounded-lg justify-center items-center">
                                                <Camera color="white" height={32} width={32} />
                                                <Text className="text-white text-xs mt-1">Add Photo</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                </View>

                                {editingItem && (
                                    <View className='w-full mt-4'>
                                        <View className='flex flex-row w-full gap-2'>
                                            <View className='w-full'>
                                                <Text className="text-gray-700 text-sm font-bold">Name</Text>
                                                <TextInput
                                                    value={editingItem.name || ''}
                                                    editable={true}
                                                    className="border-b border-gray-400 text-black"
                                                    placeholder="Item Name"
                                                    onChangeText={(text) => handleChange('name', text)}
                                                    placeholderTextColor="gray"
                                                    selectionColor="#fe6500"
                                                />
                                            </View>
                                        </View>

                                        <View className='flex flex-row w-full gap-2 mt-4'>
                                            <View className='w-1/2'>
                                                <Text className="text-gray-700 text-sm font-bold">Selling Price</Text>
                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => {
                                                        setEditingField('price');
                                                        setInputMode(true);
                                                    }}
                                                >
                                                    <Text className="text-black">₱ {formatPrice(editingItem.price || 0)}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View className='w-1/2'>
                                                <Text className="text-gray-700 text-sm font-bold">Cost Price</Text>

                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => {
                                                        setEditingField('cost');
                                                        setInputMode(true);
                                                    }}
                                                >
                                                    <Text className="text-black">₱ {formatPrice(editingItem.cost || 0)}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View className='flex flex-row w-full gap-2 mt-4'>
                                            <View className='w-full'>
                                                <Text className="text-gray-700 text-sm font-bold">Category</Text>
                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => setOpenCategories(true)}

                                                >
                                                    <Text className={`${editingItem.categoryId ? 'text-black' : 'text-gray-500'} ml-1`}>{editingItem.categoryName || 'Select Category'}</Text>
                                                </TouchableOpacity>
                                            </View>

                                        </View>
                                        <View className='flex flex-row w-full gap-2'>

                                            <View className="flex flex-row items-center">
                                                <Text className="text-gray-600 mr-2">Sell By Unit</Text>
                                                <Switch
                                                    value={editingItem?.sellbyUnit || false}
                                                    onValueChange={(value) => handleSwitchChange('sellbyUnit', value)}
                                                    thumbColor={editingItem?.sellbyUnit ? "#fe6500" : "#fe6500"}
                                                    trackColor={{ false: "#ccc", true: "#FF9E66" }}
                                                />
                                            </View>
                                        </View>
                                        <View className='flex flex-row w-full gap-2'>
                                            <View className='w-1/2'>
                                                <Text className="text-red-500 text-sm font-bold">MOQ</Text>
                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => {
                                                        setEditingField('moq');
                                                        setInputMode(true);
                                                    }}
                                                >
                                                    <Text className="text-black">{editingItem.sellbyUnit ? Math.round(editingItem.moq) || 0 : formatPrice(editingItem.moq || 0)}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View className='w-1/2'>
                                                <Text className="text-red-500 text-sm font-bold">Critical Value</Text>
                                                <TouchableOpacity
                                                    className="border-b border-gray-400 py-2"
                                                    onPress={() => {
                                                        setEditingField('criticalValue');
                                                        setInputMode(true);
                                                    }}
                                                >
                                                    <Text className="text-black">{editingItem.sellbyUnit ? Math.round(editingItem.criticalValue) || 0 : formatPrice(editingItem.criticalValue || 0)}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View className='flex flex-row w-full gap-2 mt-4'>
                                            <View className='w-full'>
                                                <Text className="text-gray-700 text-sm font-bold">Unit of Measure</Text>
                                                <TextInput
                                                    value={editingItem.unitOfMeasure || ''}
                                                    editable={true}
                                                    className="border-b border-gray-400 text-black"
                                                    placeholder="eg. pcs, kg, ml, l"
                                                    onChangeText={(text) => handleChange('unitOfMeasure', text)}
                                                    placeholderTextColor="gray"
                                                    onFocus={() => {
                                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                                    }}
                                                    selectionColor="#fe6500"
                                                    autoCapitalize='none'
                                                />
                                            </View>

                                        </View>
                                    </View>
                                )}

                            </View>
                            {!keyboardVisible && (
                                <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                                    <TouchableOpacity
                                        onPress={() => handleSave()}
                                        className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                                        disabled={!isValid}
                                    >
                                        <View className="flex-1 flex flex-row items-center justify-center">
                                            <Text className={`font-bold text-lg ${!isValid ? 'text-[#fe6500]' : 'text-white'} text-center`}>SAVE</Text>
                                            {loading && (
                                                <ActivityIndicator size={'small'} color={'white'}></ActivityIndicator>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )
                            }
                        </View >
                    )
                    }
                    {renderModal(categories)}
                </View >
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
export default ItemViewScreen;