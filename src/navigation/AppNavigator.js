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

    const loginType = String(payload?.type || "").toLowerCase();

    if (loginType === "m3u") {
      setIsRefreshingData(false);
      setIsEpgLoading(false);
      setIsEpgReady(false);
      setEpgMessage("Carregando Live TV...");
    } else {
      setIsRefreshingData(false);
      setIsEpgLoading(false);
      setIsEpgReady(false);
      setEpgMessage("Preparando guia...");
    }
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

    const loginType = String(session?.type || "").toLowerCase();

    try {
      setIsRefreshingData(true);

      if (loginType === "m3u") {
        setEpgMessage("Atualizando Live TV...");

        const liveData = await loadM3U(session.url, { only: "live" });
        const safeLiveData = mergeData({
          ...session?.data,
          live: liveData.live,
          liveCategories: liveData.liveCategories,
        });

        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            data: safeLiveData,
          };
        });

        await writeCache(session.url, safeLiveData);

        setEpgMessage("Atualizando filmes...");

        const movieData = await loadM3U(session.url, { only: "movie" });
        const safeMovieData = mergeData({
          ...safeLiveData,
          movies: movieData.movies,
          movieCategories: movieData.movieCategories,
        });

        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            data: safeMovieData,
          };
        });

        await writeCache(session.url, safeMovieData);

        setEpgMessage("Atualizando séries...");

        const seriesData = await loadM3U(session.url, { only: "series" });
        const safeSeriesData = mergeData({
          ...safeMovieData,
          series: seriesData.series,
          seriesCategories: seriesData.seriesCategories,
          loadedAt: new Date().toISOString(),
        });

        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            data: safeSeriesData,
          };
        });

        await writeCache(session.url, safeSeriesData);

        setIsEpgLoading(false);
        setIsEpgReady(false);
        setEpgMessage("Lista M3U carregada.");
        return true;
      }

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
      if (loginType === "m3u") {
        setEpgMessage("Falha ao atualizar lista M3U.");
      }
      return false;
    } finally {
      setIsRefreshingData(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function startBackgroundLoads() {
      if (!session) return;
      if (screen !== "home") return;
      if (isRefreshingData) return;

      const loginType = String(session?.type || "").toLowerCase();
      const hasLive = Array.isArray(session?.data?.live) && session.data.live.length > 0;
      const hasMovies = Array.isArray(session?.data?.movies) && session.data.movies.length > 0;
      const hasSeries = Array.isArray(session?.data?.series) && session.data.series.length > 0;

      if (loginType === "m3u") {
        try {
          if (!hasLive) {
            setIsRefreshingData(true);
            setEpgMessage("Carregando Live TV...");

            const liveData = await loadM3U(session.url, { only: "live" });
            if (!active) return;

            const safeLiveData = mergeData({
              ...session?.data,
              live: liveData.live,
              liveCategories: liveData.liveCategories,
            });

            setSession((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                data: safeLiveData,
              };
            });

            await writeCache(session.url, safeLiveData);

            if (!active) return;
            setEpgMessage("Live TV carregada.");
          }

          if (!hasMovies) {
            setEpgMessage("Carregando filmes...");

            const movieData = await loadM3U(session.url, { only: "movie" });
            if (!active) return;

            setSession((prev) => {
              if (!prev) return prev;

              const nextData = mergeData({
                ...prev.data,
                movies: movieData.movies,
                movieCategories: movieData.movieCategories,
              });

              writeCache(prev.url, nextData);
              return {
                ...prev,
                data: nextData,
              };
            });

            if (!active) return;
            setEpgMessage("Filmes carregados.");
          }

          if (!hasSeries) {
            setEpgMessage("Carregando séries...");

            const seriesData = await loadM3U(session.url, { only: "series" });
            if (!active) return;

            setSession((prev) => {
              if (!prev) return prev;

              const nextData = mergeData({
                ...prev.data,
                series: seriesData.series,
                seriesCategories: seriesData.seriesCategories,
                loadedAt: new Date().toISOString(),
              });

              writeCache(prev.url, nextData);
              return {
                ...prev,
                data: nextData,
              };
            });

            if (!active) return;
            setEpgMessage("Lista M3U carregada.");
          }
        } catch (e) {
          if (!active) return;
          setEpgMessage("Falha ao carregar lista M3U.");
        } finally {
          if (active) {
            setIsRefreshingData(false);
          }
        }

        return;
      }

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

    if (session && screen === "home") {
      startBackgroundLoads();
    }

    return () => {
      active = false;
    };
  }, [session, screen, isRefreshingData, isEpgLoading, isEpgReady]);

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
