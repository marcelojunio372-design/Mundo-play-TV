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

const CACHE_KEY = "mundoplaytv_session_cache_v5";

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

function mergeSectionData(currentData, incomingData, section = "all") {
  const current = mergeData(currentData);
  const incoming = mergeData(incomingData);

  if (section === "live") {
    return {
      ...current,
      live: incoming.live,
      liveCategories: incoming.liveCategories,
      loadedAt: incoming.loadedAt || current.loadedAt,
    };
  }

  if (section === "movie") {
    return {
      ...current,
      movies: incoming.movies,
      movieCategories: incoming.movieCategories,
      loadedAt: incoming.loadedAt || current.loadedAt,
    };
  }

  if (section === "series") {
    return {
      ...current,
      series: incoming.series,
      seriesCategories: incoming.seriesCategories,
      loadedAt: incoming.loadedAt || current.loadedAt,
    };
  }

  return mergeData(incoming);
}

async function readCacheForUrl(url) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY_DATA;

    const parsed = JSON.parse(raw);
    if (parsed?.url !== url) return EMPTY_DATA;

    return mergeData(parsed?.data);
  } catch (e) {
    return EMPTY_DATA;
  }
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
    const cachedData = await readCacheForUrl(payload?.url);

    setSession({
      ...payload,
      data: mergeData(cachedData),
    });

    setScreen("home");
    setSelectedMovie(null);
    setSelectedSeries(null);
    setSelectedSeason(null);
  };

  const handleLogout = () => {
    setSession(null);
    setScreen("home");
    setSelectedMovie(null);
    setSelectedSeries(null);
    setSelectedSeason(null);
    setIsRefreshingData(false);
  };

  const handleRefreshSection = async (section = "all") => {
    if (!session?.url) return false;
    if (isRefreshingData) return false;

    try {
      setIsRefreshingData(true);

      const data = await loadM3U(session.url, {
        only: section === "all" ? "all" : section,
      });

      let mergedData = null;

      setSession((prev) => {
        if (!prev) return prev;

        mergedData = mergeSectionData(prev.data, data, section);

        return {
          ...prev,
          data: mergedData,
        };
      });

      const currentCache = await readCacheForUrl(session.url);
      const cacheMerged = mergeSectionData(currentCache, data, section);
      await writeCache(session.url, cacheMerged);

      return true;
    } catch (e) {
      return false;
    } finally {
      setIsRefreshingData(false);
    }
  };

  const handleReload = async () => {
    return handleRefreshSection("all");
  };

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen === "live") {
    return (
      <LiveTVScreen
        session={session}
        isRefreshingData={isRefreshingData}
        onRefreshSession={() => handleRefreshSection("live")}
        onOpenHome={() => setScreen("home")}
        onOpenLive={() => setScreen("live")}
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
        onRefreshSession={() => handleRefreshSection("movie")}
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
        isRefreshingData={isRefreshingData}
        onRefreshSession={() => handleRefreshSection("series")}
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
      onSelectMovie={(movie) => {
        setSelectedMovie(movie);
        setScreen("movieDetails");
      }}
      onSelectSeries={(series) => {
        setSelectedSeries(series);
        setScreen("seriesDetails");
      }}
    />
  );
}
