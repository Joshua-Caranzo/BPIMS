import React, { useState, useCallback, useMemo } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ItemStackParamList } from '../../../navigation/navigation';
import { updateDiscount } from '../../../services/salesRepo';
import NumericKeypad from '../../../../components/NumericKeypad';

type Props = NativeStackScreenProps<ItemStackParamList, 'Discount'>;

const DiscountScreen = React.memo(({ route }: Props) => {
  const { discount, subTotal, user } = route.params;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [disc, setDisc] = useState<string>(Number(discount).toFixed(2));
  const [percentage, setPercentage] = useState<string | null>(null);
  const [activeDiscount, setActiveDiscount] = useState<'cash' | 'percentage'>('cash');
  const navigation = useNavigation<NativeStackNavigationProp<ItemStackParamList>>();

  const applyDiscount = useCallback(async () => {
    setLoading(true);
    await updateDiscount(Number(disc));
    setLoading(false);
    navigation.navigate('Cart', { user });
  }, [disc, navigation]);

  const handleKeyPress = useCallback(
    (key: string) => {
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
    },
    [activeDiscount, disc, percentage, subTotal]
  );

  // Handle backspace on numeric keypad
  const handleBackspace = useCallback(() => {
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
  }, [activeDiscount, disc, percentage, subTotal]);

  // Memoized formatted discount and percentage
  const formattedDiscount = useMemo(() => disc, [disc]);
  const formattedPercentage = useMemo(() => percentage || '0', [percentage]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fe6500" />
        <Text className="text-[#fe6500] mt-2">Applying Discount...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View className="top-3 flex flex-row justify-between px-2">
        <TouchableOpacity
          className="bg-gray px-1 pb-2 ml-2"
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft height={28} width={28} color="#fe6500" />
        </TouchableOpacity>
        <Text className="text-black text-lg font-bold">Discount on ₱ {subTotal}</Text>
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
      <View className="items-center bg-gray relative mt-1 pb-32">
        <View className="w-full h-[2px] bg-gray-500 mt-1 mb-2"></View>
        <View className="items-center w-[90%] mt-4 h-[60%]">
          <View className="flex flex-column items-center justify-center">
            <TouchableOpacity
              className="items-center"
              onPress={() => setActiveDiscount('cash')}
            >
              <Text className="text-lg font-bold text-gray-600 px-3 mt-4">Cash Discount</Text>
              <View
                className={`flex flex-row items-center mt-6 w-48 border-b-2 ${activeDiscount === 'cash' ? 'border-[#fe6500]' : 'border-gray-500'
                  } px-4 justify-center`}
              >
                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                  ₱ {formattedDiscount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="flex flex-column mt-6 items-center">
            <TouchableOpacity
              className="items-center"
              onPress={() => setActiveDiscount('percentage')}
            >
              <Text className="text-lg font-bold text-gray-600 px-3 mt-2">Percentage Discount</Text>
              <View
                className={`flex flex-row items-center mt-6 w-48 border-b-2 ${activeDiscount === 'percentage' ? 'border-[#fe6500]' : 'border-gray-500'
                  } px-4 justify-center`}
              >
                <Text className="text-center text-3xl text-[#fe6500] tracking-widest">
                  {formattedPercentage} %
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View className="absolute bottom-0 w-full items-center pb-3 pt-2">
        <NumericKeypad onPress={handleKeyPress} onBackspace={handleBackspace} />
        <TouchableOpacity
          onPress={applyDiscount}
          className={`w-[95%] rounded-xl p-3 flex flex-row items-center ${disc === '0.00' ? 'bg-gray border-2 border-[#fe6500]' : 'bg-[#fe6500]'
            }`}
        >
          <View className="flex-1 items-center">
            <Text
              className={`text-lg font-bold ${disc === '0.00' ? 'text-[#fe6500]' : 'text-white'
                }`}
            >
              APPLY DISCOUNT
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default DiscountScreen;