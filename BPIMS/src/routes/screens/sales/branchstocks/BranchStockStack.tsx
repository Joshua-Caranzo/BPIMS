import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BranchStockParamList } from "../../../navigation/navigation";
import BranchStockScreen from "./BranchStockScreen";
import StockInputScreen from "./StockInput";

const BranchStock = createNativeStackNavigator<BranchStockParamList>();

export default function BranchStockNavigator() {
    return (
        <BranchStock.Navigator screenOptions={{ headerShown: false }}>
            <BranchStock.Screen name="BranchStock" component={BranchStockScreen} />
            <BranchStock.Screen name="StockInput" component={StockInputScreen} />
        </BranchStock.Navigator>
    );
}
