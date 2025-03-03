import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    Switch,
    ActivityIndicator,
    Keyboard
} from 'react-native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { UsersHQParamList } from '../../../navigation/navigation';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Eye, EyeOff, XCircle } from 'react-native-feather';
import { addUser, editUser, getBranches, getDepartments, getUser } from '../../../services/userRepo';
import { ObjectDto, UserListDto } from '../../../types/userType';

type Props = NativeStackScreenProps<UsersHQParamList, 'UserView'>;

const UserViewScreen = React.memo(({ route }: Props) => {
    let { id } = route.params;

    const [user, setUser] = useState<UserListDto | null>(null);
    const [branches, setBranches] = useState<ObjectDto[]>([]);
    const [departments, setDepartments] = useState<ObjectDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modalType, setModalType] = useState<'branch' | 'department' | null>(null);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [emailErrorMessage, setEmailErrorMessage] = useState<string>('');
    const navigation = useNavigation<NativeStackNavigationProp<UsersHQParamList>>();
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [isCPasswordVisible, setCPasswordVisible] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            const branchResponse = await getBranches();
            const departmentResponse = await getDepartments();
            setBranches(branchResponse);
            setDepartments(departmentResponse);
            if (id !== 0) {
                const response = await getUser(id);
                setUser(response?.data || null);
            } else {
                setUser({
                    id: 0,
                    name: '',
                    email: '',
                    branchId: null,
                    branchName: null,
                    departmentId: 0,
                    deptName: '',
                    hasHeadAccess: false,
                    password: '',
                });
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);


    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);


    const handleChange = (key: keyof UserListDto, value: any) => {
        setUser((prevUser) => ({
            ...(prevUser ?? {
                id: 0,
                name: '',
                email: '',
                branchId: null,
                branchName: null,
                departmentId: 0,
                deptName: '',
                hasHeadAccess: false,
                password: null
            }),
            [key]: value,
        }));
    };

    function validateForm() {
        let passwordsMatch = true
        if (user?.id == 0)
            passwordsMatch = user?.password === confirmPassword;
        let emailValid = true
        if (user?.email)
            emailValid = typeof user?.email === 'string' && user.email.endsWith('@gmail.com');

        setEmailErrorMessage(emailValid ? '' : 'Invalid Email Address');

        setErrorMessage(passwordsMatch ? '' : 'Passwords do not match');

        const isFormValid = (
            user?.name !== '' &&
            user?.email !== '' &&
            user?.departmentId !== 0 &&
            passwordsMatch &&
            emailValid
        );

        setIsValid(isFormValid);
    }

    useEffect(() => {
        validateForm();
    }, [user, confirmPassword]);

    const handleSave = async () => {
        if (user) {
            setLoading(true);

            if (user.id === 0) {
                const response = await addUser(user);
                navigation.replace('UserView', { id: response.data });
            } else {
                const response = await editUser(user);
                navigation.replace('UserView', { id: response.data });
            }
            setLoading(false);
        }
    };


    const openModal = (type: 'branch' | 'department') => setModalType(type);
    const closeModal = () => setModalType(null);

    const renderModal = (data: ObjectDto[], type: 'branch' | 'department') => (
        <Modal transparent visible={modalType === type} animationType="slide">
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white p-5 rounded-lg w-4/5 relative">
                    <TouchableOpacity className="absolute top-2 right-2 p-1" onPress={closeModal}>
                        <XCircle width={24} height={24} />
                    </TouchableOpacity>

                    <Text className="text-lg font-bold mb-2 text-center">
                        Select {type === 'branch' ? 'Branch' : 'Department'}
                    </Text>

                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="p-3 border-b border-gray-200"
                                onPress={() => {
                                    handleChange(type === 'branch' ? 'branchId' : 'departmentId', item.id);
                                    handleChange(type === 'branch' ? 'branchName' : 'deptName', item.name);
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
    );

    if (loading) {
        return (
            <View className="flex flex-1 justify-center items-center mt-10">
                <ActivityIndicator size="small" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex flex-1 p-4">
            <View className="flex flex-row items-center mb-4">
                <TouchableOpacity className="mr-2" onPress={() => navigation.navigate('Users')}>
                    <ChevronLeft height={28} width={28} color="#fe6500" />
                </TouchableOpacity>
                <Text className="font-bold text-lg">{user?.id !== 0 ? user?.name : 'New User'}</Text>
            </View>

            <View className="bg-gray-200 h-[2px] w-full mb-4"></View>

            <View className="w-full pr-2 mb-3">
                <Text className="text-gray-600 mb-1">Name</Text>
                <TextInput
                    value={user?.name || ''}
                    onChangeText={(text) => handleChange('name', text)}
                    className="border-b border-gray-400 py-2 text-black"
                    placeholder="User Name"
                    placeholderTextColor="gray"
                    selectionColor="#fe6500"
                />
            </View>
            <View className="w-full pr-2 mb-3">
                <View className='flex flex-row'>
                    <Text className="text-gray-600 mb-1">Email</Text>
                    {emailErrorMessage && (
                        <Text className="text-xs text-red-400 mt-0.5 ml-2">{emailErrorMessage}</Text>
                    )}
                </View>
                <TextInput
                    value={user?.email || ''}
                    onChangeText={(text) => handleChange('email', text)}
                    className="border-b border-gray-400 py-2 text-black"
                    placeholder="Email"
                    placeholderTextColor="gray"
                    selectionColor="#fe6500"
                    autoCorrect={false}
                />
            </View>
            <View>
                <View className="w-full pr-2 mb-3">
                    <View className='flex flex-row'>
                        <Text className="text-gray-600 mb-1">Password</Text>
                        {errorMessage && (
                            <Text className="ml-2 text-xs text-red-400 mt-0.5">{errorMessage}</Text>
                        )}
                    </View>
                    <View className="flex-row items-center border-b border-gray-400 justify-between">
                        <TextInput
                            value={user?.password || ''}
                            onChangeText={(text) => handleChange('password', text)}
                            className="w-[80%] py-2 text-black"
                            placeholder="Password"
                            placeholderTextColor="gray"
                            secureTextEntry={!isPasswordVisible}
                            selectionColor="#fe6500"
                        />
                        {user?.password &&
                            <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
                                {isPasswordVisible ?
                                    <EyeOff
                                        height={16}
                                        width={16}
                                        color={"black"}
                                    />
                                    :
                                    <Eye
                                        height={16}
                                        width={16}
                                        color={"black"}
                                    />
                                }

                            </TouchableOpacity>
                        }
                    </View>
                </View>
                <View className="w-full pr-2 mb-3">
                    <Text className="text-gray-600 mb-1">Confirm Password</Text>
                    <View className="flex-row items-center border-b border-gray-400 justify-between">

                        <TextInput
                            value={confirmPassword}
                            onChangeText={(text) => setConfirmPassword(text)}
                            className="w-[80%] py-2 text-black"
                            placeholder="Confirm Password"
                            placeholderTextColor="gray"
                            secureTextEntry={!isCPasswordVisible}
                            selectionColor="#fe6500"
                        />
                        {confirmPassword &&
                            <TouchableOpacity onPress={() => setCPasswordVisible(!isCPasswordVisible)}>
                                {isCPasswordVisible ?
                                    <EyeOff
                                        height={16}
                                        width={16}
                                        color={"black"}
                                    />
                                    :
                                    <Eye
                                        height={16}
                                        width={16}
                                        color={"black"}
                                    />
                                }

                            </TouchableOpacity>
                        }
                    </View>
                </View>
            </View>

            <View className="w-full pr-2 mb-3">
                <Text className="text-gray-600 mb-1">Department</Text>
                <TouchableOpacity
                    className="border-b border-gray-400 py-2"
                    onPress={() => openModal('department')}
                >
                    <Text className={`${user?.departmentId !== 0 ? 'text-black' : 'text-gray-500'} ml-1`}>{user?.deptName || 'Select Department'}</Text>
                </TouchableOpacity>
            </View>
            {user?.departmentId === 1 && (
                <View className="w-full pr-2 mb-3">
                    <Text className="text-gray-600 mb-1">Branch</Text>
                    <TouchableOpacity
                        className="border-b border-gray-400 py-2"
                        onPress={() => openModal('branch')}
                    >
                        <Text className={`${user?.branchId !== null ? 'text-black' : 'text-gray-400'} ml-1`}>{user?.branchName || 'Select Branch'}</Text>
                    </TouchableOpacity>
                </View>
            )}
            {user?.departmentId === 1 && (
                <View className="flex flex-row items-center mb-4">
                    <Text className="text-gray-600 mr-2">Has Head Access</Text>
                    <Switch
                        value={user?.hasHeadAccess || false}
                        onValueChange={(value) => handleChange('hasHeadAccess', value)}
                        thumbColor={user?.hasHeadAccess ? "#fe6500" : "#fe6500"}
                        trackColor={{ false: "#ccc", true: "#FF9E66" }}
                    />
                </View>
            )}
            {!keyboardVisible && (
                <View className='items-center absolute bottom-0 left-0 right-0 pb-2'>
                    <TouchableOpacity
                        onPress={handleSave}
                        className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${!isValid ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                        disabled={!isValid}
                    >
                        <View className="flex-1 flex flex-row items-center justify-center">
                            <Text className={`font-bold text-lg ${!isValid ? 'text-[#fe6500]' : 'text-white'}`}>SAVE</Text>
                            {loading && (
                                <ActivityIndicator size={'small'} color={'white'}></ActivityIndicator>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            )}
            {renderModal(branches, 'branch')}
            {renderModal(departments, 'department')}
        </View>
    );
});

export default UserViewScreen;
