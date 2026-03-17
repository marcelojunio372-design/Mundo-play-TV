import React, { useState } from "react";
import { Alert } from "react-native";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import LiveTVScreen from "../screens/LiveTVScreen";
import MoviesScreen from "../screens/MoviesScreen";
import SeriesScreen from "../screens/SeriesScreen";
import SettingsScreen from "../screens/SettingsScreen";

export default function AppNavigator() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("home");
  const [session, setSession] = useState(null);

  const handleLogin = (payload) => {
    setSession(payload);
    setLoggedIn(true);
    setScreen("home");
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setSession(null);
    setScreen("home");
  };

  const handleReload = () => {
    Alert.alert("Recarregar", "Volte ao login e conecte novamente sua lista.");
    setLoggedIn(false);
    setScreen("home");
  };

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen === "live") {
    return (
      <LiveTVScreen
        session={session}
        onBack={() => setScreen("home")}
        onOpenSettings={() => setScreen("settings")}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "movies") {
    return (
      <MoviesScreen
        session={session}
        onBack={() => setScreen("home")}
        onOpenSettings={() => setScreen("settings")}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "series") {
    return (
      <SeriesScreen
        session={session}
        onBack={() => setScreen("home")}
        onOpenSettings={() => setScreen("settings")}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "settings") {
    return <SettingsScreen session={session} onBack={() => setScreen("home")} onLogout={handleLogout} />;
  }

  return (
    <HomeScreen
      session={session}
      onOpenLive={() => setScreen("live")}
      onOpenMovies={() => setScreen("movies")}
      onOpenSeries={() => setScreen("series")}
      onOpenSettings={() => setScreen("settings")}
      onReload={handleReload}
      onLogout={handleLogout}
    />
  );
}
