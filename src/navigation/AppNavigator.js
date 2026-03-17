import React, { useState } from "react";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import LiveTVScreen from "../screens/LiveTVScreen";
import MoviesScreen from "../screens/MoviesScreen";
import MovieDetailsScreen from "../screens/MovieDetailsScreen";
import SeriesScreen from "../screens/SeriesScreen";
import SeriesDetailsScreen from "../screens/SeriesDetailsScreen";
import SeasonEpisodesScreen from "../screens/SeasonEpisodesScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { loadM3U } from "../services/m3uService";

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("home");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);

  const handleLogin = (payload) => {
    setSession(payload);
    setScreen("home");
  };

  const handleLogout = () => {
    setSession(null);
    setScreen("home");
    setSelectedMovie(null);
    setSelectedSeries(null);
    setSelectedSeason(null);
  };

  const handleReload = async () => {
    if (!session?.url) return false;

    try {
      const data = await loadM3U(session.url);
      setSession((prev) => ({ ...prev, data }));
      return true;
    } catch (e) {
      return false;
    }
  };

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen === "live") {
    return (
      <LiveTVScreen
        session={session}
        onOpenHome={() => setScreen("home")}
        onOpenLive={() => setScreen("live")}
        onOpenMovies={() => setScreen("movies")}
        onOpenSeries={() => setScreen("series")}
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
        onOpenLive={() => setScreen("live")}
        onOpenMovies={() => setScreen("movies")}
        onOpenSeries={() => setScreen("series")}
        onSelectMovie={(movie) => {
          setSelectedMovie(movie);
          setScreen("movieDetails");
        }}
      />
    );
  }

  if (screen === "movieDetails") {
    return (
      <MovieDetailsScreen
        movie={selectedMovie}
        onBack={() => setScreen("movies")}
      />
    );
  }

  if (screen === "series") {
    return (
      <SeriesScreen
        session={session}
        onBack={() => setScreen("home")}
        onOpenLive={() => setScreen("live")}
        onOpenMovies={() => setScreen("movies")}
        onOpenSeries={() => setScreen("series")}
        onSelectSeries={(series) => {
          setSelectedSeries(series);
          setScreen("seriesDetails");
        }}
      />
    );
  }

  if (screen === "seriesDetails") {
    return (
      <SeriesDetailsScreen
        series={selectedSeries}
        onBack={() => setScreen("series")}
        onOpenSeason={(season) => {
          setSelectedSeason(season);
          setScreen("seasonEpisodes");
        }}
      />
    );
  }

  if (screen === "seasonEpisodes") {
    return (
      <SeasonEpisodesScreen
        series={selectedSeries}
        season={selectedSeason}
        onBack={() => setScreen("seriesDetails")}
      />
    );
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        session={session}
        onBack={() => setScreen("home")}
        onLogout={handleLogout}
        onReload={handleReload}
      />
    );
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
