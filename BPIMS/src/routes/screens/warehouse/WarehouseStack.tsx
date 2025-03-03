import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WarehouseStackParamList } from "../../navigation/navigation";
import WHNavigator from "./stocks/WHStocksStack";

const WarehouseStack = createNativeStackNavigator<WarehouseStackParamList>();

export default function WareHouseNavigator() {
    return (
        <WarehouseStack.Navigator screenOptions={{ headerShown: false }}>
            <WarehouseStack.Screen name="WHStock" component={WHNavigator} />
        </WarehouseStack.Navigator>
    );
}
