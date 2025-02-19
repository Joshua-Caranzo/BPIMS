import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { BarChart } from 'react-native-gifted-charts';
import { Menu } from 'react-native-feather';
import { debounce, stubFalse } from 'lodash';
import { getSocketData } from '../../../utils/apiService';
import {
    BranchDto,
    DailyTransactionResponse,
    TotalSalesDto,
} from '../../../types/reportType';
import HQSidebar from '../../../../components/HQSidebar';

const SalesReportScreen = React.memo(() => {
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [branches, setBranches] = useState<BranchDto[]>([]);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const socketRef = useRef<WebSocket | null>(null);
    const salesSocketRef = useRef<WebSocket | null>(null);
    const [totalSalesMonthly, setTotalSalesMonthly] = useState<number>(0);
    const [totalSalesYearly, setTotalSalesYearly] = useState<number>(0);

    useEffect(() => {
        const fetchUserDetails = async () => {
            const user = await getUserDetails();
            setUser(user);
        };
        fetchUserDetails();
    }, []);

    useEffect(() => {
        const socket = getSocketData('dailyTransactionHQ');
        socketRef.current = socket;

        socket.onmessage = (event) => {
            try {
                const parsedData: DailyTransactionResponse = JSON.parse(event.data);
                debouncedBranchData(parsedData.branches);
                debouncedTotalAmount(parsedData.totalAmount);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            } finally {
                setLoading(false);
            }
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        const salesSocket = getSocketData('totalSalesHQ');
        salesSocketRef.current = salesSocket;

        salesSocket.onmessage = (event) => {
            try {
                const parsedData: TotalSalesDto = JSON.parse(event.data);
                debouncedTotalData(parsedData);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            }
        };

        return () => {
            if (salesSocketRef.current) {
                salesSocketRef.current.close();
            }
        };
    }, []);

    const debouncedBranchData = useCallback(
        debounce((data: BranchDto[]) => {
            setBranches(data);
        }, 100),
        []
    );

    const debouncedTotalAmount = useCallback(
        debounce((data: number) => {
            setTotalAmount(data);
        }, 100),
        []
    );

    const debouncedTotalData = useCallback(
        debounce((data: TotalSalesDto) => {
            setTotalSalesMonthly(data.totalSalesPerMonth);
            setTotalSalesYearly(data.totalSalesPerYear);
        }, 100),
        []
    );

    const handleChangeCategory = useCallback((id: number) => {
        setActiveCategory(id);
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const barData = useMemo(() => {
        return branches.map((branch) => ({
            value: branch.dailyTotal || 0,
            label: branch.name || "",
            topLabelComponent: () => (
                <Text className='text-[10px] font-bold text-black'>₱ {branch.dailyTotal.toFixed(2)}</Text>
            ),
        }));
    }, [branches]);

    const screenWidth = Dimensions.get('window').width;

    const spacing = useMemo(() => {
        const numberOfDataPoints = barData.length;
        return numberOfDataPoints > 1 ? (screenWidth - 180) / (numberOfDataPoints) : 0;
    }, [barData, screenWidth]);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#fe6500" />
                <Text className="text-[#fe6500] mt-2">Loading Sales Data...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {user && (
                <HQSidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
            )}
            <View className="top-3 flex bg-gray flex-row justify-between px-2">
                <TouchableOpacity className="mt-1 ml-2" onPress={toggleSidebar}>
                    <Menu width={20} height={20} color="#fe6500" />
                </TouchableOpacity>
                <Text className="text-black text-lg font-bold">Sales Report</Text>
                <View className="items-center mr-2">
                    <View className="px-2 py-1 bg-[#fe6500] rounded-lg">
                        <Text className="text-white" style={{ fontSize: 12 }}>
                            {user?.name ? user.name.split(' ')[0].toUpperCase() : ''}
                        </Text>
                    </View>
                </View>
            </View>
            <View className="w-full justify-center items-center bg-gray relative mt-4">
                <View className="w-full flex-row justify-between px-2">
                    {[0, 1, 2].map((id) => (
                        <TouchableOpacity
                            key={id}
                            onPress={() => handleChangeCategory(id)}
                            className={`${activeCategory === id ? 'border-b-4 border-yellow-500' : ''} w-[30%] justify-center items-center`}
                        >
                            <Text
                                className={`${activeCategory === id ? 'text-gray-900' : 'text-gray-500'} text-[10px] font-medium text-center`}
                            >
                                {['TODAY', 'MONTH', 'ANALYTICS'][id]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <View className="w-full h-[2px] bg-gray-500"></View>
            {activeCategory === 0 && (
                <View>
                    <View className="w-full justify-center items-center bg-gray mt-4 pl-2 pr-3">
                        <View className="w-full">
                            <BarChart
                                noOfSections={3}
                                frontColor="#fdbb17"
                                data={barData}
                                yAxisThickness={0}
                                xAxisThickness={2}
                                xAxisLength={spacing * 6 - 40}
                                xAxisColor={"gray"}
                                spacing={spacing}
                                barWidth={60}
                                xAxisLabelTextStyle={{ fontSize: 10, color: '#000' }}
                                yAxisTextStyle={{ fontSize: 10, color: '#000' }}
                                hideYAxisText
                                hideRules
                                disableScroll
                                initialSpacing={10}
                            />
                        </View>
                    </View>
                    <View className="items-center flex flex-row w-full mt-6 px-4">
                        <Text className="text-lg text-gray-600 mr-2">Total Revenue:</Text>
                        <Text className="text-lg text-[#fe6500]">₱ {totalAmount.toFixed(2)}</Text>
                    </View>
                    <View className="items-center flex flex-row w-full mt-1 px-4">
                        <Text className="text-lg text-gray-600 mr-2">Total Profit:</Text>
                        <Text className="text-lg text-[#fe6500]">₱ {totalAmount.toFixed(2)}</Text>
                    </View>

                    <ScrollView className="w-full mt-4 px-4">
                        <Text className="text-lg text-gray-600 mr-2 font-bold">Top 5 Items</Text>
                        <View className="flex flex-row justify-between">
                            {branches.map((branch, index) => (
                                <View key={index} className="flex flex-column w-[30%]">
                                    <Text className="text-sm">{branch.name}</Text>
                                    {[...Array(5)].map((_, itemIndex) => {
                                        const item = branch.topItems[itemIndex];
                                        return (
                                            <Text key={itemIndex} className="text-xs">
                                                {itemIndex + 1}. {item ? item.itemName : ''}
                                            </Text>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            )}
            {activeCategory === 1 && (
                <View>
                    <View className="justify-center items-center bg-gray mt-4 flex flex-row px-4 justify-between">
                        <View className="flex flex-column">
                            <Text className="text-sm text-gray-900">Total Sales of the Month</Text>
                            <Text className="text-lg text-[#fe6500] font-bold text-center">
                                ₱ {totalSalesMonthly?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View className="flex flex-column">
                            <Text className="text-sm text-gray-900">Total Sales of the Year</Text>
                            <Text className="text-lg text-[#fe6500] font-bold text-center">
                                ₱ {totalSalesYearly?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>
                    <View className="w-full h-[2px] bg-gray-500 mt-2"></View>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SalesReportScreen;