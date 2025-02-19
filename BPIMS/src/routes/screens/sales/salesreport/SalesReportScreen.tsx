import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import Sidebar from '../../../../components/Sidebar';
import { UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { LineChart } from 'react-native-gifted-charts';
import { Menu } from 'react-native-feather';
import { debounce } from 'lodash';
import { getSocketData } from '../../../utils/apiService';
import {
    capitalizeFirstLetter,
    formatTransactionDate,
    formatTransactionTime,
} from '../../../utils/dateFormat';
import {
    DailyTransactionDto,
    ReportRequest,
    SalesGraphDto,
    TotalSalesDto,
} from '../../../types/reportType';

const SalesReportScreen = React.memo(() => {
    const [user, setUser] = useState<UserDetails>();
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [graphData, setGraphData] = useState<SalesGraphDto[]>([]);
    const [transactions, setTransactions] = useState<DailyTransactionDto[]>([]);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [totalSalesMonthly, setTotalSalesMonthly] = useState<number>(0);
    const [totalSalesYearly, setTotalSalesYearly] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const socketRef = useRef<WebSocket | null>(null);
    const salesSocketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            const user = await getUserDetails();
            setUser(user);
        };
        fetchUserDetails();
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }

        const socket = getSocketData('dailyTransaction', { branchId: user.branchId });
        socketRef.current = socket;

        socket.onmessage = (event) => {
            try {
                const parsedData: ReportRequest = JSON.parse(event.data);
                debouncedSetGraphData(parsedData.graphData);
                debouncedTransactionData(parsedData.transactions);
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
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        const salesSocket = getSocketData('totalSales', { branchId: user.branchId });
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
    }, [user]);

    const debouncedSetGraphData = useCallback(
        debounce((data: SalesGraphDto[]) => {
            setGraphData(data);
        }, 100),
        []
    );

    const debouncedTransactionData = useCallback(
        debounce((data: DailyTransactionDto[]) => {
            setTransactions(data);
            const total = data.reduce((sum, transaction) => sum + (transaction?.totalAmount || 0), 0);
            setTotalAmount(total);
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

    const chartData = useMemo(() => {
        return [
            { value: 0, label: '7 AM', dataPointText: '₱ 0.00' },
            { value: graphData[0]?.totalAmount || 0, label: '9:30 AM', dataPointText: `₱ ${graphData[0]?.totalAmount.toFixed(2) || '0.00'}` },
            { value: graphData[1]?.totalAmount || 0, label: '12 Noon', dataPointText: `₱ ${graphData[1]?.totalAmount.toFixed(2) || '0.00'}` },
            { value: graphData[2]?.totalAmount || 0, label: '2:30 PM', dataPointText: `₱ ${graphData[2]?.totalAmount.toFixed(2) || '0.00'}` },
            { value: graphData[3]?.totalAmount || 0, label: '5 PM', dataPointText: `₱ ${graphData[3]?.totalAmount.toFixed(2) || '0.00'}` },
        ];
    }, [graphData]);

    const screenWidth = Dimensions.get('window').width;
    const spacing = useMemo(() => {
        const numberOfDataPoints = chartData.length;
        return (screenWidth - 70) / (numberOfDataPoints - 1);
    }, [chartData, screenWidth]);

    const formattedDate = useMemo(() => {
        return new Date().toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'long',
            day: '2-digit',
            year: 'numeric',
        });
    }, []);

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
                <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} userDetails={user} />
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
                <View className="justify-center items-center bg-gray mt-2">
                    <View className="w-full">
                        <LineChart
                            thickness={6}
                            height={200}
                            color="#fe6500"
                            noOfSections={3}
                            areaChart
                            data={chartData}
                            startFillColor="rgba(254, 101, 0, 0.4)"
                            endFillColor="rgba(243, 244, 246, 0.4)"
                            startOpacity={0.4}
                            endOpacity={0.4}
                            hideRules
                            initialSpacing={20}
                            dataPointsWidth={20}
                            yAxisColor="transparent"
                            xAxisColor="transparent"
                            dataPointsColor="#fe6500"
                            xAxisLabelTextStyle={{ color: '#000', fontSize: 10, textAlign: 'center' }}
                            yAxisTextStyle={{ color: '#000', fontSize: 10 }}
                            spacing={spacing}
                            adjustToWidth
                            hideYAxisText
                            disableScroll
                            textColor="black"
                        />
                    </View>
                    <View className="items-center flex flex-row justify-between w-full mt-6 px-4">
                        <Text className="text-sm text-[#fe6500]">{formattedDate}</Text>
                        <Text className="text-sm text-[#fe6500]">{user?.branchName.toUpperCase()}</Text>
                    </View>
                    <View className="items-center flex flex-row justify-between w-full mt-1 px-4">
                        <Text className="text-lg text-black font-bold">₱ {totalAmount.toFixed(2)}</Text>
                        <Text className="text-sm text-gray-600">Branch</Text>
                    </View>
                    <ScrollView className="w-full mt-4 px-4 h-[50%]">
                        {transactions.map((transaction, index) => (
                            <View key={index} className="mb-3 py-1 bg-gray rounded-lg border-b border-gray-500">
                                <View className="flex-row justify-between">
                                    <View className="flex flex-row">
                                        <Text className="text-black font-semibold">
                                            ₱ {transaction.totalAmount.toFixed(2)}
                                        </Text>
                                        <Text className="text-gray-500 font-medium">
                                            {' '}by {capitalizeFirstLetter(transaction.cashierName)},{' '}
                                            {formatTransactionTime(transaction.transactionDate.toString())}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-500 font-medium">{transaction.slipNo}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-gray-700 font-medium">
                                        {transaction.items.length} {transaction.items.length === 1 ? 'item' : 'items'}:
                                    </Text>
                                    <Text className="text-gray-600 flex-1" numberOfLines={1} ellipsizeMode="tail">
                                        {transaction.items.map((item) => item.itemName).join(', ')}
                                    </Text>
                                </View>
                            </View>
                        ))}
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