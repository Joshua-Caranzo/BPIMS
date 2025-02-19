import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SalesReportHQParamList, SalesReportParamList } from "../../../navigation/navigation";
import SalesReportScreen from "./SalesReportScreen";

const SalesStack = createNativeStackNavigator<SalesReportHQParamList>();

export default function SalesReportHQNavigator() {
    return (
        <SalesStack.Navigator screenOptions={{ headerShown: false }}>
            <SalesStack.Screen name="SalesReport" component={SalesReportScreen} />
        </SalesStack.Navigator>
    );
}
