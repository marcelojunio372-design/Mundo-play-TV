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

  const handleReload = async () => {
    try {
      if (!session?.url) {
        Alert.alert("Erro", "URL da lista não encontrada");
        return;
      }

      const { loadM3U } = require("../services/m3uService");
      const data = await loadM3U(session.url);

      setSession({
        ...session,
        data,
      });

      Alert.alert("Sucesso", "Lista recarregada!");
    } catch (e) {
      Alert.alert("Erro", "Falha ao recarregar lista");
    }
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
