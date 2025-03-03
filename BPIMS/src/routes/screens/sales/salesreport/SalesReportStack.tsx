import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SalesReportParamList } from "../../../navigation/navigation";
import SalesReportScreen from "./SalesReportScreen";
import TransactionHistoryScreen from "./TransactionHistory";

const SalesStack = createNativeStackNavigator<SalesReportParamList>();

export default function SalesReportNavigator() {
    return (
        <SalesStack.Navigator screenOptions={{ headerShown: false }}>
            <SalesStack.Screen name="SalesReport" component={SalesReportScreen} />
            <SalesStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        </SalesStack.Navigator>
    );
}
