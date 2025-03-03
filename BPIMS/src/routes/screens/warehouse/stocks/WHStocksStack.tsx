import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WhStockStackParamList } from "../../../navigation/navigation";
import WHScreen from "./WHScreen";
import StockInputScreen from "./StockInput";

const WHSTack = createNativeStackNavigator<WhStockStackParamList>();

export default function WHNavigator() {
    return (
        <WHSTack.Navigator screenOptions={{ headerShown: false }}>
            <WHSTack.Screen name="WHScreen" component={WHScreen} />
            <WHSTack.Screen name="StockInput" component={StockInputScreen} />
        </WHSTack.Navigator>
    );
}
