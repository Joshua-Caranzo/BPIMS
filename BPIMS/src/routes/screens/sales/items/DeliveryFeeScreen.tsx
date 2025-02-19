import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ItemStackParamList } from '../../../navigation/navigation';
import { updateDeliveryFee } from '../../../services/salesRepo';
import FullScreenLoader from '../../../../components/FullScreenLoader';
import { ChevronLeft } from 'react-native-feather';
import { getUserDetails } from '../../../utils/auth';
import { UserDetails } from '../../../types/userType';
import NumericKeypad from '../../../../components/NumericKeypad';

type Props = NativeStackScreenProps<ItemStackParamList, 'DeliveryFee'>;

export default function DeliveryFeeScreen({ route }: Props) {
    let { deliveryFee } = route.params;
    const [isLoading, setLoading] = useState<boolean>(false);
    const [loaderMessage, setLoaderMessage] = useState<string>('Loading...');
    const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();
    const [user, setUser] = useState<UserDetails>();
    const [fee, setFee] = useState<string>(Number(deliveryFee).toFixed(2) || "0.00");

    useEffect(() => {
        async function getUser() {
            const user = await getUserDetails();
            setUser(user);
        }

        getUser();
    }, []);

    async function applyFee() {
        setLoaderMessage('Applying Fee...');
        if (fee) {
            setLoading(true);
            await updateDeliveryFee(Number(fee));
            setLoading(false);
        }
        navigation.navigate('Cart')
    }

    const handleKeyPress = (key: string) => {
        if (fee) {
            let current = fee.replace('.', '');
            current += key;
            const formatted = (parseInt(current) / 100).toFixed(2);
            setFee(formatted)
        }
    };

    const handleBackspace = () => {
        if (fee) {
            let current = fee.replace('.', '');
            current = current.slice(0, -1) || '0';
            const formatted = (parseInt(current) / 100).toFixed(2);
            setFee(formatted)
        }
    };

    if (isLoading) {
        return <FullScreenLoader message={loaderMessage} />;
    }

    return (
        <View style={{ flex: 1 }}>
            <View className='top-3 flex flex-row justify-between px-2'>
                <TouchableOpacity
                    className="bg-gray px-1 pb-2 ml-2"
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft height={28} width={28} color={"#fe6500"} />
                </TouchableOpacity>
                <Text className="text-black text-lg font-bold">Delivery Fee</Text>
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
            <View className="items-center bg-gray relative mt-1 pb-32">
                <View className="w-full h-[2px] bg-gray-500 mt-1 mb-2"></View>
                <View className="items-center w-[90%] mt-4 h-[60%]">
                    <View className="flex flex-column items-center">
                        <Text className="text-lg font-bold text-gray-600 px-3 mt-4">
                            Delivery Fee
                        </Text>
                        <View className="flex flex-row items-center mt-6 w-48 border-b-2 border-[#fe6500] px-4 justify-center">
                            <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                ₱ {fee}
                            </Text>
                        </View>
                    </View>
                </View>

            </View>
            <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                <TouchableOpacity onPress={applyFee} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${fee === "0.00" ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                >
                    <View className="flex-1 items-center">
                        <Text className={`text-lg font-bold ${fee === "0.00" ? 'text-[#fe6500]' : 'text-white'}`}>
                            APPLY FEE
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
