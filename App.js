import React, { useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  useEffect(() => {
    async function lockScreen() {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    }

    lockScreen();
  }, []);

  return <AppNavigator />;
}
