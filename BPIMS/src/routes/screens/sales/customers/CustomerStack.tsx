import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CustomerStackParamList } from "../../../navigation/navigation";
import CustomerScreen from "./CustomerScreen";
import CustomerViewScreen from "./CustomerViewScreen";

const CustomersStack = createNativeStackNavigator<CustomerStackParamList>();

export default function CustomerNavigator() {
  return (
    <CustomersStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomersStack.Screen name="Customer" component={CustomerScreen} />
      <CustomersStack.Screen name="CustomerView" component={CustomerViewScreen} />
    </CustomersStack.Navigator>
  );
}
