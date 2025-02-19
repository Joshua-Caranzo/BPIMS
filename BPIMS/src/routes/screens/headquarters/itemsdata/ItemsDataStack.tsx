import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ItemsHQParamList } from "../../../navigation/navigation";
import ItemListScreen from "./ItemListScreen";

const ItemStack = createNativeStackNavigator<ItemsHQParamList>();

export default function ItemsHQNavigator() {
    return (
        <ItemStack.Navigator screenOptions={{ headerShown: false }}>
            <ItemStack.Screen name="Items" component={ItemListScreen} />
        </ItemStack.Navigator>
    );
}
