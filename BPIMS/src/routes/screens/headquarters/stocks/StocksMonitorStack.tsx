import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StockMonitorParamList } from "../../../navigation/navigation";
import StockMonitorScreen from "./StockMonitorScreen";
import StockInputScreen from "./StockInput";

const StockMonitor = createNativeStackNavigator<StockMonitorParamList>();

export default function StockMonitorNavigator() {
    return (
        <StockMonitor.Navigator screenOptions={{ headerShown: false }}>
            <StockMonitor.Screen name="StockMonitor" component={StockMonitorScreen} />
            <StockMonitor.Screen name="StockInput" component={StockInputScreen} />
        </StockMonitor.Navigator>
    );
}
