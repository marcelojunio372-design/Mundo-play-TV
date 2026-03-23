import React, { useEffect, useState } from "react";
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
import { warmupEPG } from "../services/epgService";

const CACHE_KEY = "mundoplaytv_session_cache_v7";

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

  const [isEpgLoading, setIsEpgLoading] = useState(false);
  const [isEpgReady, setIsEpgReady] = useState(false);
  const [epgMessage, setEpgMessage] = useState("");

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

    setIsEpgLoading(false);
    setIsEpgReady(false);
    setEpgMessage("Preparando guia...");
  };

  const handleLogout = () => {
    setSession(null);
    setScreen("home");
    setSelectedMovie(null);
    setSelectedSeries(null);
    setSelectedSeason(null);
    setIsRefreshingData(false);
    setIsEpgLoading(false);
    setIsEpgReady(false);
    setEpgMessage("");
  };

  const handleReload = async () => {
    if (!session?.url) return false;
    if (isRefreshingData) return false;

    try {
      setIsRefreshingData(true);

      const data = await loadM3U(session.url, { only: "all" });
      const safeData = mergeData(data);

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: safeData,
        };
      });

      await writeCache(session.url, safeData);

      setIsEpgReady(false);
      setEpgMessage("Lista atualizada. Preparando guia...");

      return true;
    } catch (e) {
      return false;
    } finally {
      setIsRefreshingData(false);
    }
  };

  useEffect(() => {
    let active = true;
    let timer = null;

    async function startEpgWarmup() {
      if (!session) return;
      if (screen !== "home") return;
      if (isEpgLoading || isEpgReady) return;

      try {
        setIsEpgLoading(true);
        setEpgMessage("Carregando guia de programação...");
        await warmupEPG(session);

        if (!active) return;

        setIsEpgReady(true);
        setEpgMessage("Guia carregado.");
      } catch (e) {
        if (!active) return;

        setIsEpgReady(false);
        setEpgMessage("Não foi possível carregar o guia agora.");
      } finally {
        if (active) {
          setIsEpgLoading(false);
        }
      }
    }

    if (session && screen === "home" && !isEpgLoading && !isEpgReady) {
      timer = setTimeout(() => {
        startEpgWarmup();
      }, 1200);
    }

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [session, screen, isEpgLoading, isEpgReady]);

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen === "live") {
    return (
      <LiveTVScreen
        session={session}
        isEpgReady={isEpgReady}
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
      isEpgLoading={isEpgLoading}
      isEpgReady={isEpgReady}
      epgMessage={epgMessage}
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
