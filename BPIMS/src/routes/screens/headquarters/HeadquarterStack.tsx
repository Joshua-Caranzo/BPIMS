import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeadQuarterStackParamList } from "../../navigation/navigation";
import SalesReportHQNavigator from "./salesreport/SalesReportStack";
import UsersHQNavigator from "./users/UserStack";
import ItemsHQNavigator from "./itemsdata/ItemsDataStack";

const HQStack = createNativeStackNavigator<HeadQuarterStackParamList>();

export default function HQNavigator() {
    return (
        <HQStack.Navigator screenOptions={{ headerShown: false }}>
            <HQStack.Screen name="SalesReportStack" component={SalesReportHQNavigator} />
            <HQStack.Screen name="UserStack" component={UsersHQNavigator} />
            <HQStack.Screen name="ItemsStack" component={ItemsHQNavigator} />
        </HQStack.Navigator>
    );
}
