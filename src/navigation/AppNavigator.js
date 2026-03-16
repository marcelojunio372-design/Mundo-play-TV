import React, { useState } from "react";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import LiveTVScreen from "../screens/LiveTVScreen";
import MoviesScreen from "../screens/MoviesScreen";
import SeriesScreen from "../screens/SeriesScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";
import LanguageScreen from "../screens/LanguageScreen";
import SettingsScreen from "../screens/SettingsScreen";

export default function AppNavigator() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("home");

  const handleLogin = () => {
    setLoggedIn(true);
    setScreen("home");
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setScreen("home");
  };

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen === "live") {
    return <LiveTVScreen onBack={() => setScreen("home")} onLogout={handleLogout} />;
  }

  if (screen === "movies") {
    return <MoviesScreen onBack={() => setScreen("home")} onLogout={handleLogout} />;
  }

  if (screen === "series") {
    return <SeriesScreen onBack={() => setScreen("home")} onLogout={handleLogout} />;
  }

  if (screen === "subscription") {
    return <SubscriptionScreen onBack={() => setScreen("home")} onLogout={handleLogout} />;
  }

  if (screen === "languages") {
    return <LanguageScreen onBack={() => setScreen("home")} onLogout={handleLogout} />;
  }

  if (screen === "settings") {
    return <SettingsScreen onBack={() => setScreen("home")} onLogout={handleLogout} />;
  }

  return (
    <HomeScreen
      onOpenLive={() => setScreen("live")}
      onOpenMovies={() => setScreen("movies")}
      onOpenSeries={() => setScreen("series")}
      onOpenSubscription={() => setScreen("subscription")}
      onOpenLanguages={() => setScreen("languages")}
      onOpenSettings={() => setScreen("settings")}
      onLogout={handleLogout}
    />
  );
}
