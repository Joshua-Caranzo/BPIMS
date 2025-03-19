import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SalesReportHQParamList } from "../../../navigation/navigation";
import SalesReportScreen from "./SalesReportScreen";
import TransactionListScreen from "./TransactionList";
import TransactionHistoryScreen from "./TransactionHistory";

const SalesStack = createNativeStackNavigator<SalesReportHQParamList>();

export default function SalesReportHQNavigator() {
    return (
        <SalesStack.Navigator screenOptions={{ headerShown: false }}>
            <SalesStack.Screen name="SalesReport" component={SalesReportScreen} />
            <SalesStack.Screen name="TransactionList" component={TransactionListScreen} />
            <SalesStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        </SalesStack.Navigator>
    );
}
