import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const CACHE_KEY = "mundoplaytv_session_cache_v11";

const EMPTY_DATA = {
  live: [],
  movies: [],
  series: [],
  liveCategories: [],
  movieCategories: [],
  seriesCategories: [],
  loadedAt: null,
};

function mergeData(data) {
  return {
    ...EMPTY_DATA,
    ...(data || {}),
    live: Array.isArray(data?.live) ? data.live : [],
    movies: Array.isArray(data?.movies) ? data.movies : [],
    series: Array.isArray(data?.series) ? data.series : [],
    liveCategories: Array.isArray(data?.liveCategories) ? data.liveCategories : [],
    movieCategories: Array.isArray(data?.movieCategories) ? data.movieCategories : [],
    seriesCategories: Array.isArray(data?.seriesCategories) ? data.seriesCategories : [],
  };
}

async function writeCache(url, data) {
  try {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        url,
        data: mergeData(data),
        savedAt: new Date().toISOString(),
      })
    );
  } catch (e) {}
}

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("home");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  const handleLogin = async (payload) => {
    const safeData = mergeData(payload?.data);

    await writeCache(payload?.url, safeData);

    setSession({
      ...payload,
      data: safeData,
    });

    setScreen("home");
    setSelectedMovie(null);
    setSelectedSeries(null);
    setSelectedSeason(null);
    setIsRefreshingData(false);
  };

  const handleLogout = () => {
    setSession(null);
    setScreen("home");
    setSelectedMovie(null);
    setSelectedSeries(null);
    setSelectedSeason(null);
    setIsRefreshingData(false);
  };

  const handleReload = async () => {
    if (!session?.url || isRefreshingData) return false;

    try {
      setIsRefreshingData(true);

      const data = await loadM3U(session.url);
      const safeData = mergeData(data);

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: safeData,
        };
      });

      await writeCache(session.url, safeData);
      return true;
    } catch (e) {
      return false;
    } finally {
      setIsRefreshingData(false);
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
        onOpenMovies={() => setScreen("movies")}
        onOpenSeries={() => setScreen("series")}
      />
    );
  }

  if (screen === "movies") {
    return (
      <MoviesScreen
        session={session}
        isRefreshingData={isRefreshingData}
        onRefreshSession={handleReload}
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
    return <MovieDetailsScreen movie={selectedMovie} onBack={() => setScreen("movies")} />;
  }

  if (screen === "series") {
    return (
      <SeriesScreen
        session={session}
        isRefreshingData={isRefreshingData}
        onRefreshSession={handleReload}
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
      isRefreshingData={isRefreshingData}
      onOpenLive={() => setScreen("live")}
      onOpenMovies={() => setScreen("movies")}
      onOpenSeries={() => setScreen("series")}
      onOpenSettings={() => setScreen("settings")}
      onReload={handleReload}
    />
  );
}
