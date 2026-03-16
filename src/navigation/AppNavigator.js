import React, { useState } from "react";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import LiveTVScreen from "../screens/LiveTVScreen";
import MoviesScreen from "../screens/MoviesScreen";
import SeriesScreen from "../screens/SeriesScreen";
import SettingsScreen from "../screens/SettingsScreen";

export default function AppNavigator() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [screen, setScreen] = useState("home");

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  if (screen === "live") {
    return (
      <LiveTVScreen
        onBack={() => setScreen("home")}
        onOpenSettings={() => setScreen("settings")}
        onLogout={() => {
          setLoggedIn(false);
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "movies") {
    return (
      <MoviesScreen
        onBack={() => setScreen("home")}
        onOpenSettings={() => setScreen("settings")}
        onLogout={() => {
          setLoggedIn(false);
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "series") {
    return (
      <SeriesScreen
        onBack={() => setScreen("home")}
        onOpenSettings={() => setScreen("settings")}
        onLogout={() => {
          setLoggedIn(false);
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        onBack={() => setScreen("home")}
        onLogout={() => {
          setLoggedIn(false);
          setScreen("home");
        }}
      />
    );
  }

  return (
    <HomeScreen
      onOpenLive={() => setScreen("live")}
      onOpenMovies={() => setScreen("movies")}
      onOpenSeries={() => setScreen("series")}
      onOpenSettings={() => setScreen("settings")}
      onLogout={() => {
        setLoggedIn(false);
        setScreen("home");
      }}
    />
  );
}
