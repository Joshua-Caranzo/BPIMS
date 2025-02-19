import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SalesStackParamList } from "../../navigation/navigation";
import ItemNavigator from "./items/ItemStack";
import CustomerNavigator from "./customers/CustomerStack";
import BranchStockNavigator from "./branchstocks/BranchStockStack";
import SalesReportNavigator from "./salesreport/SalesReportStack";

const SalesStack = createNativeStackNavigator<SalesStackParamList>();

export default function SalesNavigator() {
    return (
        <SalesStack.Navigator screenOptions={{ headerShown: false }}>
            <SalesStack.Screen name="ItemStack" component={ItemNavigator} />
            <SalesStack.Screen name="CustomerStack" component={CustomerNavigator} />
            <SalesStack.Screen name="BranchStockStack" component={BranchStockNavigator} />
            <SalesStack.Screen name="SalesReportStack" component={SalesReportNavigator} />
        </SalesStack.Navigator>
    );
}
