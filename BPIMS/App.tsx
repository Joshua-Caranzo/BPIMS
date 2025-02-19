import React from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/routes/screens/Home";
import SalesNavigator from "./src/routes/screens/sales/SalesStack";
import HQNavigator from "./src/routes/screens/headquarters/HeadquarterStack";

const RootStack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Home" component={HomeScreen} />
        <RootStack.Screen name="SalesStack" component={SalesNavigator} />
        <RootStack.Screen name="HeadquarterStack" component={HQNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
