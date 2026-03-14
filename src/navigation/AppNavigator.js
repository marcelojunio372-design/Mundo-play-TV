import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import LiveTVScreen from "../screens/LiveTVScreen";
import MoviesScreen from "../screens/MoviesScreen";
import SeriesScreen from "../screens/SeriesScreen";
import PlayerScreen from "../screens/PlayerScreen";
import SubscriptionInfoScreen from "../screens/SubscriptionInfoScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="LiveTV" component={LiveTVScreen} />
        <Stack.Screen name="Movies" component={MoviesScreen} />
        <Stack.Screen name="Series" component={SeriesScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
        <Stack.Screen name="SubscriptionInfo" component={SubscriptionInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
