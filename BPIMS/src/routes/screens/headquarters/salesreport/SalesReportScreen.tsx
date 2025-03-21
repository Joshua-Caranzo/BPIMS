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
import { ObjectDto, UserDetails } from '../../../types/userType';
import { getUserDetails } from '../../../utils/auth';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Menu } from 'react-native-feather';
import { debounce } from 'lodash';
import { getSocketData } from '../../../utils/apiService';
import {
    AnalysisReportResponse,
    BranchDto,
    DailyTransactionDto,
    DailyTransactionResponse,
    TotalSalesDto,
} from '../../../types/reportType';
import HQSidebar from '../../../../components/HQSidebar';
import { FilterType, SalesData } from '../../../types/salesType';
import { formatTransactionDateOnly, truncateShortName } from '../../../utils/dateFormat';
import { getAllTransactionHistoryHQ } from '../../../services/salesRepo';
import { getBranches } from '../../../services/userRepo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SalesReportHQParamList } from '../../../navigation/navigation';

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
    const analysisSocketRef = useRef<WebSocket | null>(null);
    const analyticsSocketRef = useRef<WebSocket | null>(null);
    const [totalSalesMonthly, setTotalSalesMonthly] = useState<number>(0);
    const [totalSalesYearly, setTotalSalesYearly] = useState<number>(0);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>("Month");
    const screenWidth = Dimensions.get('window').width;
    const [salesData, setSalesData] = useState<SalesData>();
    const [analysisReport, setAnalysisReport] = useState<AnalysisReportResponse>();
    const [transactionHistory, setTransactionHistory] = useState<DailyTransactionDto[]>([]);
    const navigation = useNavigation<NativeStackNavigationProp<SalesReportHQParamList>>();

    const filteredData = salesData ? salesData[selectedFilter] : [];
    const chartPadding = 40; // Adjust padding/margin as needed

    const dataLength = filteredData.length || 1; // Avoid division by zero
    const calculatedSpacing = selectedFilter === "All" || "Year"
        ? Math.max((screenWidth - chartPadding) / dataLength, 60)  // If "all" is selected, min 60
        : Math.max((screenWidth - chartPadding) / dataLength, 30); // Otherwise, min 30


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
        const fetchTransactionHistory = async () => {
            try {
                const history = await getAllTransactionHistoryHQ(null, 1, "");
                setTransactionHistory(history.data);
            } catch (error) {
                console.error('Error fetching transaction history:', error);
            }
        };

        if (user) {
            fetchTransactionHistory();
        }
    }, [user]);

    const goToTransaction = useCallback(() => {
        const fetchBranchesAndNavigate = async () => {
            if (!user) return;
            let br = await getBranches();

            const all: ObjectDto =
            {
                id: 0,
                name: "ALL"
            }
            br.push(all);
            navigation.navigate('TransactionList', { transactions: transactionHistory, user, branches: br });
        };
        fetchBranchesAndNavigate();
    }, [user, transactionHistory, navigation]);


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

    useEffect(() => {
        if (!user) {
            return;
        }

        const analysisSocket = getSocketData('analyticsDataHQ');
        analysisSocketRef.current = analysisSocket;

        analysisSocket.onmessage = (event) => {
            try {
                const parsedData: SalesData = JSON.parse(event.data);
                debouncedAnalyticsData(parsedData);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            }
        };

        return () => {
            if (analysisSocketRef.current) {
                analysisSocketRef.current.close();
            }
        };
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        const analyticsSocket = getSocketData('analysisReportHQ');
        analyticsSocketRef.current = analyticsSocket;

        analyticsSocket.onmessage = (event) => {
            try {
                const parsedData: AnalysisReportResponse = JSON.parse(event.data);
                debouncedAnalysisData(parsedData);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            }
        };

        return () => {
            if (analyticsSocketRef.current) {
                analyticsSocketRef.current.close();
            }
        };
    }, [user]);

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


    const debouncedAnalyticsData = useCallback(
        debounce((data: SalesData) => {
            setSalesData(data);
        }, 100),
        []
    );

    const debouncedAnalysisData = useCallback(
        debounce((data: AnalysisReportResponse) => {
            setAnalysisReport(data);
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
                            {truncateShortName(user?.name ? user.name.split(' ')[0].toUpperCase() : '')}
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
                        <View className="w-full flex-row justify-end">
                            <TouchableOpacity>
                                <Text
                                    className="text-sm text-[#fe6500] font-medium"
                                    onPress={() => goToTransaction()}
                                >
                                    View All Transactions
                                </Text>
                            </TouchableOpacity>
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
                <View className="w-full justify-center items-center bg-gray mt-2 p-2">
                    <View className="w-full">

                        <View className="w-full flex-row justify-around mb-4">
                            {(["Week", "Month", "Year", "All"] as FilterType[]).map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    className={`px-4 py-2 rounded ${selectedFilter === filter ? "bg-[#fe6500]" : "bg-transparent"
                                        }`}
                                    onPress={() => setSelectedFilter(filter)}
                                >
                                    <Text className={`${selectedFilter === filter ? "text-white" : "text-black"
                                        }`}>{filter}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <LineChart
                            data={filteredData}
                            width={screenWidth - 40}
                            animateOnDataChange
                            thickness={3}
                            height={200}
                            color="#fe6500"
                            noOfSections={3}
                            areaChart
                            startFillColor="rgba(254, 101, 0, 0.4)"
                            endFillColor="rgba(243, 244, 246, 0.4)"
                            startOpacity={0.4}
                            endOpacity={0.4}
                            hideRules
                            yAxisColor="transparent"
                            xAxisColor="transparent"
                            dataPointsColor="#fe6500"
                            xAxisLabelTextStyle={{ color: '#000', fontSize: 10, textAlign: 'center' }}
                            yAxisTextStyle={{ color: '#000', fontSize: 10 }}
                            adjustToWidth
                            hideYAxisText
                            initialSpacing={20}
                            endSpacing={20}
                            dataPointsWidth={20}
                            spacing={calculatedSpacing}
                            textColor="black"

                        />
                    </View>
                    {analysisReport && (
                        <View className="w-full mt-4 p-4">
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text
                                        className={`font-semibold text-lg ${analysisReport.percentChange > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}
                                    >
                                        {analysisReport.percentChange > 0 ? '▲' : '▼'} {analysisReport.percentChange}%
                                    </Text>
                                    <Text className="text-gray-500 text-xs">This month vs avg months</Text>
                                </View>
                            </View>
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text className="text-green-600 font-semibold text-lg">₱ {analysisReport.highestSalesAmount}</Text>
                                    <Text className="text-gray-500 text-xs">Highest Sales – {formatTransactionDateOnly(analysisReport.highestSalesDate || "")}</Text>
                                </View>
                            </View>
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text className="text-green-600 font-semibold text-lg">₱ {analysisReport.highestSalesMonthAmount}</Text>
                                    <Text className="text-gray-500 text-xs">Highest Sales This Month – {formatTransactionDateOnly(analysisReport.highestSalesMonthDate || "")}</Text>
                                </View>
                            </View>
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text className="text-blue-600 font-semibold text-lg">{analysisReport.highOrderPercentage}</Text>
                                    <Text className="text-gray-500 text-xs">High-value orders (₱1,500+)</Text>
                                </View>
                            </View>
                            <View className="justify-center items-center bg-gray mt-4 border-y border-gray-500">
                                <View className="flex flex-column items-center">
                                    <Text className="text-orange-600 font-semibold text-lg">{analysisReport.peakPeriod}</Text>
                                    <Text className="text-gray-500 text-xs">Peak Sales Hours</Text>
                                </View>
                            </View>
                        </View>
                    )}
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