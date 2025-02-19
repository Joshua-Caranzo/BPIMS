import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ItemStackParamList } from '../../../navigation/navigation';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { useNavigation } from '@react-navigation/native';
import { updateDiscount } from '../../../services/salesRepo';
import FullScreenLoader from '../../../../components/FullScreenLoader';
import { ChevronLeft } from 'react-native-feather';
import NumericKeypad from '../../../../components/NumericKeypad';

type Props = NativeStackScreenProps<ItemStackParamList, 'Discount'>;

export default function DiscountScreen({ route }: Props) {
    const { discount, subTotal } = route.params;
    const [isLoading, setLoading] = useState<boolean>(false);
    const [loaderMessage, setLoaderMessage] = useState<string>("Loading...");
    const [percentage, setPercentage] = useState<string | null>(null);
    const [user, setUser] = useState<UserDetails>();
    const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();
    const [disc, setDisc] = useState<string>(Number(discount).toFixed(2));
    const [activeDiscount, setActiveDiscount] = useState<'cash' | 'percentage'>('cash');

    useEffect(() => {
        async function getUser() {
            const user = await getUserDetails();
            setUser(user);
        }
        getUser();
    }, []);

    async function applyDiscount() {
        setLoaderMessage('Applying Discount...')
        if (disc) {
            setLoading(true)
            await updateDiscount(Number(disc))
            setLoading(false)
        }
        navigation.navigate('Cart')
    }

    const handleKeyPress = (key: string) => {
        if (activeDiscount === 'percentage') {
            let current = percentage?.replace('.', '') || '';
            current += key;
            const formatted = (parseInt(current) / 100).toFixed(2);

            const calculatedDiscount = (Number(subTotal) * (Number(formatted) / 100)).toFixed(2);
            if (Number(calculatedDiscount) > Number(subTotal)) return;

            setPercentage(formatted);
            setDisc(calculatedDiscount);
        } else if (activeDiscount === 'cash') {
            let current = disc.replace('.', '');
            current += key;
            const formatted = (parseInt(current) / 100).toFixed(2);

            if (Number(formatted) > Number(subTotal)) return;

            setDisc(formatted);
            const p = (Number(formatted) / Number(subTotal)) * 100;
            setPercentage(p.toFixed(2).toString());
        }
    };

    const handleBackspace = () => {
        if (activeDiscount === 'percentage') {
            let current = percentage?.replace('.', '') || '';
            current = current.slice(0, -1) || '0';
            const formatted = (parseInt(current) / 100).toFixed(2);
            setPercentage(formatted);
            const calculatedDiscount = (Number(subTotal) * (Number(formatted) / 100)).toFixed(2);
            setDisc(calculatedDiscount);
        } else if (activeDiscount === 'cash') {
            let current = disc.replace('.', '');
            current = current.slice(0, -1) || '0';
            const formatted = (parseInt(current) / 100).toFixed(2);
            setDisc(formatted);
            const p = (Number(formatted) / Number(subTotal)) * 100;
            setPercentage(p.toFixed(2).toString());
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
                <Text className="text-black text-lg font-bold">Discount on  ₱ {subTotal}</Text>
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
                    <View className='flex flex-column items-center justify-center'>
                        <TouchableOpacity className="items-center" onPress={() => setActiveDiscount('cash')}>
                            <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Cash Discount</Text>
                            <View className={`flex flex-row items-center mt-6 w-48 border-b-2 ${activeDiscount === 'cash' ? 'border-[#fe6500]' : 'border-gray-500'} px-4 justify-center`}>
                                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                    ₱ {disc}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View className='flex flex-column mt-10 items-center'>
                        <TouchableOpacity className="items-center" onPress={() => setActiveDiscount('percentage')}>
                            <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Percentage Discount</Text>
                            <View className={`flex flex-row items-center mt-6 w-48 border-b-2 ${activeDiscount === 'percentage' ? 'border-[#fe6500]' : 'border-gray-500'} px-4 justify-center`}>
                                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                                    {percentage || 0} %
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                </View>

            </View>
            <View className='absolute bottom-0 w-full items-center pb-3 pt-2'>
                <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
                <TouchableOpacity onPress={applyDiscount} className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${disc === "0.00" ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'}`}
                >
                    <View className="flex-1 items-center">
                        <Text className={`text-lg font-bold ${disc === "0.00" ? 'text-[#fe6500]' : 'text-white'}`}>
                            APPLY FEE
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
