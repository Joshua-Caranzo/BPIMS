import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    BackHandler,
} from 'react-native';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Menu } from 'react-native-feather';
import { debounce } from 'lodash';
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
    const [totalProfit, setTotalProfit] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const socketRef = useRef<WebSocket | null>(null);
    const salesSocketRef = useRef<WebSocket | null>(null);
    const [totalSalesMonthly, setTotalSalesMonthly] = useState<number>(0);
    const [totalSalesYearly, setTotalSalesYearly] = useState<number>(0);

    useEffect(() => {
        const backAction = () => {
            BackHandler.exitApp();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

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
                const totalProfit = parsedData.branches.reduce((sum, branch) => sum + branch.totalProfit, 0);
                debouncedTotalProfit(totalProfit);
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

    const debouncedTotalProfit = useCallback(
        debounce((data: number) => {
            setTotalProfit(data);
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
                <Text className="text-black text-lg font-bold">SALES REPORT</Text>
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
                <ScrollView className="flex-1 bg-white p-4">
                    <View className="w-full justify-center items-center mt-4">
                        <View className="w-full bg-gray-50 rounded-lg p-3 shadow-sm">
                            <BarChart
                                isAnimated
                                noOfSections={3}
                                frontColor="#fe6500"
                                data={barData}
                                yAxisThickness={0}
                                xAxisThickness={1}
                                xAxisLength={spacing * 6 - 40}
                                xAxisColor="transparent"
                                spacing={spacing}
                                barWidth={50}
                                xAxisLabelTextStyle={{ fontSize: 10, color: '#6B7280' }}
                                yAxisTextStyle={{ fontSize: 10, color: '#6B7280' }}
                                hideYAxisText
                                hideRules
                                disableScroll
                                initialSpacing={10}
                            />
                        </View>
                    </View>

                    <View className="mt-6 px-2">
                        <View className="flex flex-row justify-between items-center bg-gray-50 rounded-lg p-4 shadow-sm">
                            <Text className="text-lg text-gray-700 font-medium">Total Revenue:</Text>
                            <Text className="text-lg text-[#fe6500] font-semibold">₱ {totalAmount.toFixed(2)}</Text>
                        </View>
                        <View className="flex flex-row justify-between items-center bg-gray-50 rounded-lg p-4 mt-2 shadow-sm">
                            <Text className="text-lg text-gray-700 font-medium">Total Profit:</Text>
                            <Text className="text-lg text-[#fe6500] font-semibold">₱ {totalProfit.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View className="mt-6 mb-8">
                        <Text className="text-xl text-gray-800 font-bold mb-4 px-2">Top 5 Items by Branch</Text>
                        <ScrollView className="w-full">
                            {branches.map((branch, index) => (
                                <View key={index} className="mb-6 bg-white rounded-lg shadow-md p-4">
                                    <Text className="text-lg font-semibold text-gray-800 mb-3">{branch.name}</Text>

                                    <View className="flex flex-row justify-between border-b border-gray-200 pb-2">
                                        <Text className="text-sm font-medium text-gray-600 w-1/4">Rank</Text>
                                        <Text className="text-sm font-medium text-gray-600 w-1/2">Item Name</Text>
                                        <Text className="text-sm font-medium text-gray-600 w-1/4 text-right">Sales</Text>
                                    </View>

                                    {[...Array(5)].map((_, itemIndex) => {
                                        const item = branch.topItems[itemIndex];
                                        return (
                                            <View key={itemIndex} className="flex flex-row justify-between py-2 border-b border-gray-100">
                                                <Text className="text-sm text-gray-700 w-1/4">{itemIndex + 1}.</Text>
                                                <Text className="text-sm text-gray-700 w-1/2">{item ? item.itemName : 'N/A'}</Text>
                                                <Text className="text-sm text-gray-700 w-1/4 text-right">
                                                    {item ? `₱ ${item.totalSales.toFixed(2)}` : '₱ 0.00'}
                                                </Text>
                                            </View>
                                        );
                                    })}

                                    <View className="flex flex-row justify-between pt-3">
                                        <Text className="text-sm font-semibold text-gray-800">Total Sales:</Text>
                                        <Text className="text-sm font-semibold text-gray-800">
                                            ₱ {branch.topItems.reduce((sum, item) => sum + (item?.totalSales || 0), 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>
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
            {activeCategory === 2 && (
                <ScrollView className="w-full p-4">
                    <Text className="text-lg font-bold text-center mb-4">Sales Analysis</Text>

                    <View className="bg-white p-4 rounded-lg shadow-md mb-6">
                        <Text className="text-md font-semibold mb-2">Sales Over a Year</Text>
                        <LineChart
                            data={[
                                { value: 5000, label: 'Jan' },
                                { value: 8000, label: 'Feb' },
                                { value: 6000, label: 'Mar' },
                                { value: 10000, label: 'Apr' },
                                { value: 7000, label: 'May' },
                                { value: 9000, label: 'Jun' },
                                { value: 12000, label: 'Jul' },
                                { value: 15000, label: 'Aug' },
                                { value: 11000, label: 'Sep' },
                                { value: 13000, label: 'Oct' },
                                { value: 14000, label: 'Nov' },
                                { value: 16000, label: 'Dec' },
                            ]}
                            thickness={4}
                            height={200}
                            color="#4CAF50"
                            noOfSections={3}
                            yAxisTextStyle={{ color: '#000', fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: '#000', fontSize: 10 }}
                            dataPointsColor="#4CAF50"
                            startFillColor="rgba(76, 175, 80, 0.3)"
                            endFillColor="rgba(76, 175, 80, 0.1)"
                            startOpacity={0.3}
                            endOpacity={0.1}
                            adjustToWidth
                            hideYAxisText
                            disableScroll
                            spacing={22}
                        />
                    </View>

                    <View className="bg-white p-4 rounded-lg shadow-md">
                        <Text className="text-md font-semibold mb-2">Sales Breakdown Per Month</Text>
                        <BarChart
                            data={[
                                { value: 3000, label: 'Jan' },
                                { value: 5000, label: 'Feb' },
                                { value: 4000, label: 'Mar' },
                                { value: 7000, label: 'Apr' },
                                { value: 6000, label: 'May' },
                                { value: 7500, label: 'Jun' },
                                { value: 9000, label: 'Jul' },
                                { value: 11000, label: 'Aug' },
                                { value: 9500, label: 'Sep' },
                                { value: 12000, label: 'Oct' },
                                { value: 13000, label: 'Nov' },
                                { value: 14000, label: 'Dec' },
                            ]}
                            barWidth={12}
                            height={200}
                            color="blue"
                            noOfSections={4}
                            hideRules
                            yAxisTextStyle={{ color: '#000', fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: '#000', fontSize: 10 }}
                            hideYAxisText
                            disableScroll
                            spacing={10}
                        />
                    </View>
                </ScrollView>
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