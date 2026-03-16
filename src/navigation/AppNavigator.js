import React, { useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import LiveTVScreen from "../screens/LiveTVScreen";
import MoviesScreen from "../screens/MoviesScreen";
import SeriesScreen from "../screens/SeriesScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0a0620",
  },
};

export default function AppNavigator() {
  const [session, setSession] = useState(null);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLoginSuccess={setSession} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home">
              {(props) => (
                <HomeScreen
                  {...props}
                  session={session}
                  onLogout={() => setSession(null)}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="LiveTV">
              {(props) => <LiveTVScreen {...props} session={session} />}
            </Stack.Screen>

            <Stack.Screen name="Movies">
              {(props) => <MoviesScreen {...props} session={session} />}
            </Stack.Screen>

            <Stack.Screen name="Series">
              {(props) => <SeriesScreen {...props} session={session} />}
            </Stack.Screen>

            <Stack.Screen name="Subscription">
              {(props) => (
                <SubscriptionScreen
                  {...props}
                  session={session}
                  onLogout={() => setSession(null)}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
