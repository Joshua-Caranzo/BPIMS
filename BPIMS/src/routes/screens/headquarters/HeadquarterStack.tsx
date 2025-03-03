import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeadQuarterStackParamList } from "../../navigation/navigation";
import SalesReportHQNavigator from "./salesreport/SalesReportStack";
import UsersHQNavigator from "./users/UserStack";
import ItemsHQNavigator from "./itemsdata/ItemsDataStack";
import StockMonitorNavigator from "./stocks/StocksMonitorStack";
import CustomerHQNavigator from "./customer/CustomerStack";

const HQStack = createNativeStackNavigator<HeadQuarterStackParamList>();

export default function HQNavigator() {
    return (
        <HQStack.Navigator screenOptions={{ headerShown: false }}>
            <HQStack.Screen name="SalesReportStack" component={SalesReportHQNavigator} />
            <HQStack.Screen name="UserStack" component={UsersHQNavigator} />
            <HQStack.Screen name="ItemsStack" component={ItemsHQNavigator} />
            <HQStack.Screen name="StockMonitorStack" component={StockMonitorNavigator} />
            <HQStack.Screen name="CustomerHQStack" component={CustomerHQNavigator} />
        </HQStack.Navigator>
    );
}
