import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SupplierParamList } from "../../../navigation/navigation";
import SupplierListScreen from "./SupplierList";
import SupplierViewScreen from "./SupplierView";

const SupplierStack = createNativeStackNavigator<SupplierParamList>();

export default function SupplierNavigator() {
    return (
        <SupplierStack.Navigator screenOptions={{ headerShown: false }}>
            <SupplierStack.Screen name="SupplierList" component={SupplierListScreen} />
            <SupplierStack.Screen name="SupplierView" component={SupplierViewScreen} />

        </SupplierStack.Navigator>
    );
}
